<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'message'    => 'required|string',
            'attachment' => 'nullable|file',
        ]);

        $user = $request->user();

        $attachmentPath = null;

        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('chat-attachments', 'public');
        }

        // Save user message
        ChatMessage::create([
            'user_id'         => $user->id,
            'role'            => 'user',
            'content'         => $request->message,
            'attachment_path' => $attachmentPath,
        ]);

        // Build system prompt from knowledge documents
        $documents = KnowledgeDocument::all();

        $systemPrompt = "Tu es un assistant intelligent pour la plateforme INSAM-IA, specialise dans l'accompagnement des etudiants.\n\n";

        if ($documents->isNotEmpty()) {
            $systemPrompt .= "Voici les documents de connaissance disponibles pour repondre aux questions :\n\n";

            foreach ($documents as $doc) {
                $systemPrompt .= "--- {$doc->title} ---\n{$doc->content}\n\n";
            }
        }

        // Retrieve conversation history for context
        $history = ChatMessage::where('user_id', $user->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Call AI service
        $reply = AiService::chat($systemPrompt, $request->message, $history);

        // Save assistant reply
        ChatMessage::create([
            'user_id' => $user->id,
            'role'    => 'assistant',
            'content' => $reply,
        ]);

        return response()->json(['reply' => $reply]);
    }

    public function history(Request $request)
    {
        $messages = ChatMessage::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($messages);
    }
}
