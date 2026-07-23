<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeDocument;
use App\Models\Setting;
use App\Models\WhatsappConversation;
use App\Models\WhatsappMessage;
use App\Services\AiService;
use Illuminate\Http\Request;

class WhatsappWebhookController extends Controller
{
    /**
     * Receive incoming messages from Baileys bridge and reply with AI.
     */
    public function handleBaileys(Request $request)
    {
        $phone   = $request->input('from');
        $message = $request->input('message', '');
        $imageB64 = $request->input('image_base64');
        $audioB64 = $request->input('audio_base64');

        if (!$phone) {
            return response()->json(['error' => 'Missing phone'], 400);
        }

        // Check if bot is active
        $botActive = Setting::get('whatsapp_bot_active', '1');
        if ($botActive !== '1') {
            return response()->json(['reply' => null]);
        }

        // Find or create conversation
        $conversation = WhatsappConversation::firstOrCreate(
            ['phone' => $phone],
            ['name' => null, 'last_message_at' => now()]
        );

        // If transferred to human, don't auto-reply
        if ($conversation->transferred) {
            return response()->json(['reply' => null]);
        }

        // Handle image/audio description in message
        $userContent = $message;
        if ($imageB64 && !$message) {
            $userContent = '[L\'utilisateur a envoye une image]';
        }
        if ($audioB64 && !$message) {
            $userContent = '[L\'utilisateur a envoye un message vocal]';
        }

        if (!$userContent) {
            return response()->json(['reply' => null]);
        }

        // Save user message
        WhatsappMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'user',
            'content'         => $userContent,
            'media_type'      => $imageB64 ? 'image' : ($audioB64 ? 'audio' : null),
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Build system prompt with knowledge documents
        $systemPrompt = $this->buildSystemPrompt();

        // Get conversation history (last 10 messages)
        $history = $conversation->messages()
            ->orderByDesc('id')
            ->take(10)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Remove the last user message from history (it's already in $userContent)
        array_pop($history);

        // Call AI
        $reply = AiService::chat($systemPrompt, $userContent, $history, 1024);

        // Handle transfer detection
        if (str_contains($reply, '[TRANSFER]') && str_contains($reply, '[/TRANSFER]')) {
            preg_match('/\[TRANSFER\](.*?)\[\/TRANSFER\]/s', $reply, $matches);
            $reason = $matches[1] ?? 'Demande de transfert';
            $conversation->update([
                'transferred'     => true,
                'transfer_reason' => $reason,
                'transferred_at'  => now(),
            ]);
            $reply = preg_replace('/\[TRANSFER\].*?\[\/TRANSFER\]/s', '', $reply);
            $reply = trim($reply);
        }

        // Save bot reply
        if ($reply) {
            WhatsappMessage::create([
                'conversation_id' => $conversation->id,
                'role'            => 'assistant',
                'content'         => $reply,
            ]);
        }

        return response()->json(['reply' => $reply]);
    }

    /**
     * Build the system prompt using Knowledge Documents and site settings.
     */
    private function buildSystemPrompt(): string
    {
        $siteName   = Setting::get('site_name', 'INSAM-IA');
        $subtitle   = Setting::get('site_subtitle', '');
        $botName    = Setting::get('whatsapp_bot_name', $siteName);
        $customInfo = Setting::get('whatsapp_custom_info', '');

        // Load ALL knowledge documents with content
        $docs = KnowledgeDocument::whereNotNull('content')
            ->where('content', '!=', '')
            ->orderByDesc('updated_at')
            ->get();

        $docsContext = '';
        $totalChars = 0;
        $maxChars = 80000; // ~80k chars for context

        if ($docs->isNotEmpty()) {
            $docsContext = "\n\n--- BASE DE CONNAISSANCES ---\n";
            $docsContext .= "Tu as acces a " . $docs->count() . " documents. Utilise ces informations pour repondre aux questions des etudiants.\n";

            foreach ($docs as $doc) {
                $content = $doc->content;
                $remaining = $maxChars - $totalChars;
                if ($remaining <= 0) break;

                $content = mb_substr($content, 0, min(mb_strlen($content), $remaining));
                $meta = [];
                if ($doc->category) $meta[] = 'Specialite: ' . $doc->category->name;
                if ($doc->uniteEnseignement) $meta[] = 'UE: ' . $doc->uniteEnseignement->nom;
                $metaStr = $meta ? ' (' . implode(', ', $meta) . ')' : '';

                $docsContext .= "\n=== {$doc->title}{$metaStr} ===\n{$content}\n";
                $totalChars += mb_strlen($content);
            }
        }

        if ($customInfo) {
            $docsContext .= "\n\n--- INFORMATIONS SUPPLEMENTAIRES ---\n{$customInfo}\n";
        }

        return <<<PROMPT
Tu es un assistant de "{$botName}" ({$subtitle}) qui repond aux etudiants et visiteurs sur WhatsApp.
Tu as une base de connaissances complete sur l'etablissement. Utilise-la pour repondre de maniere precise et fiable.

COMMENT REPONDRE - COMME UN HUMAIN :
1. Court et naturel, comme un vrai humain sur WhatsApp. Pas de longs paragraphes.
2. Formatage WhatsApp : *gras* pour infos importantes. PAS de markdown (**), PAS de puces -.
3. 1 a 3 phrases max sauf question precise qui necessite plus.
4. Ton naturel, decontracte mais professionnel.
5. Maximum 1 emoji par message.
6. TOUJOURS repondre dans la MEME LANGUE que le message recu.
7. Si tu trouves l'info dans la base de connaissances, donne une reponse precise. Sinon, dis que tu vas transmettre.
8. Tu peux orienter les etudiants vers la plateforme web insam-ia.com pour plus de details.

TRANSFERT HUMAIN : Si la question depasse ta base de connaissances ou necessite un humain :
[TRANSFER]raison[/TRANSFER]
{$docsContext}
PROMPT;
    }

    /**
     * Proxy to Baileys bridge status.
     */
    public function status()
    {
        $baileysUrl = Setting::get('baileys_url', 'http://localhost:3001');
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get("{$baileysUrl}/status");
            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['status' => 'offline', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Proxy to Baileys QR code.
     */
    public function qr()
    {
        $baileysUrl = Setting::get('baileys_url', 'http://localhost:3001');
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get("{$baileysUrl}/qr");
            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['qr' => null, 'status' => 'offline']);
        }
    }

    /**
     * List conversations for admin.
     */
    public function conversations()
    {
        $conversations = WhatsappConversation::withCount('messages')
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return response()->json($conversations);
    }

    /**
     * Get messages for a conversation.
     */
    public function conversationMessages($id)
    {
        $conversation = WhatsappConversation::findOrFail($id);
        $messages = $conversation->messages()->orderBy('created_at')->get();

        return response()->json([
            'conversation' => $conversation,
            'messages'      => $messages,
        ]);
    }

    /**
     * Send a manual reply (admin takes over).
     */
    public function sendReply(Request $request, $id)
    {
        $request->validate(['message' => 'required|string']);

        $conversation = WhatsappConversation::findOrFail($id);

        // Save to DB
        WhatsappMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'assistant',
            'content'         => $request->message,
        ]);

        // Send via Baileys
        $baileysUrl = Setting::get('baileys_url', 'http://localhost:3001');
        try {
            \Illuminate\Support\Facades\Http::timeout(10)->post("{$baileysUrl}/send/text", [
                'phone'   => $conversation->phone,
                'message' => $request->message,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Impossible d\'envoyer: ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Toggle transferred status.
     */
    public function toggleTransfer($id)
    {
        $conversation = WhatsappConversation::findOrFail($id);
        $conversation->update([
            'transferred'  => !$conversation->transferred,
            'transferred_at' => $conversation->transferred ? null : now(),
        ]);

        return response()->json($conversation);
    }
}
