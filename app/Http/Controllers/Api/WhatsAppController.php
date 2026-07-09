<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'from'    => 'required|string',
            'message' => 'required|string',
        ]);

        $from    = $request->from;
        $message = $request->message;

        // Build context from knowledge documents
        $documents = KnowledgeDocument::all();

        $systemPrompt = "Tu es un assistant WhatsApp intelligent pour la plateforme INSAM-IA. "
            . "Tu reponds de maniere concise et utile aux etudiants via WhatsApp.\n\n";

        if ($documents->isNotEmpty()) {
            $systemPrompt .= "Base de connaissance disponible :\n\n";

            foreach ($documents as $doc) {
                $systemPrompt .= "--- {$doc->title} ---\n{$doc->content}\n\n";
            }
        }

        $history = [
            ['role' => 'user', 'content' => $message],
        ];

        try {
            $reply = AiService::chat($systemPrompt, $history, $message);
        } catch (\Throwable $e) {
            $reply = "Desolee, je n'ai pas pu traiter votre demande pour le moment. Veuillez reessayer plus tard.";
        }

        return response()->json([
            'from'  => $from,
            'reply' => $reply,
        ]);
    }
}
