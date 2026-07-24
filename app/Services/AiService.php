<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AiService
{
    public static function chat(string $systemPrompt, string $userMessage, array $history = [], int $maxTokens = 2048): string
    {
        $provider = Setting::get('ai_provider', 'claude');

        if ($provider === 'gemini') {
            return static::callGemini($systemPrompt, $userMessage, $maxTokens);
        }

        return static::callClaude($systemPrompt, $userMessage, $history, $maxTokens);
    }

    /**
     * Chat with vision (image support) - Claude only.
     */
    public static function chatWithImage(string $systemPrompt, string $textMessage, string $base64Image, string $mediaType = 'image/jpeg', int $maxTokens = 4000): string
    {
        $apiKey = Setting::get('anthropic_api_key') ?: config('services.anthropic.api_key');
        if (!$apiKey) return 'Erreur: Cle API Claude non configuree.';

        $model = Setting::get('claude_model', 'claude-haiku-4-5-20251001');

        $response = Http::timeout(120)->withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'image',
                            'source' => [
                                'type' => 'base64',
                                'media_type' => $mediaType,
                                'data' => $base64Image,
                            ],
                        ],
                        [
                            'type' => 'text',
                            'text' => $textMessage,
                        ],
                    ],
                ],
            ],
        ]);

        if (!$response->successful()) {
            return 'Erreur API: ' . ($response->json('error.message') ?? 'Erreur inconnue');
        }

        return $response->json('content.0.text') ?? 'Desole, je n\'ai pas pu analyser l\'image.';
    }

    private static function callClaude(string $systemPrompt, string $userMessage, array $history, int $maxTokens): string
    {
        $apiKey = Setting::get('anthropic_api_key') ?: config('services.anthropic.api_key');
        if (!$apiKey) return 'Erreur: Cle API Claude non configuree.';

        $model = Setting::get('claude_model', 'claude-haiku-4-5-20251001');

        $messages = [];
        foreach ($history as $msg) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $response = Http::timeout(60)->withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => $messages,
        ]);

        if (!$response->successful()) {
            return 'Erreur API: ' . ($response->json('error.message') ?? 'Erreur inconnue');
        }

        return $response->json('content.0.text') ?? 'Desole, je n\'ai pas pu repondre.';
    }

    /**
     * Get all Gemini API keys and rotate through them.
     */
    private static function getGeminiKeys(): array
    {
        $keys = Setting::get('gemini_api_keys', '');
        if ($keys) {
            return array_filter(array_map('trim', explode(',', $keys)));
        }
        // Fallback to single key
        $single = Setting::get('gemini_api_key') ?: config('services.gemini.api_key');
        return $single ? [$single] : [];
    }

    /**
     * Get the current Gemini key index and advance it.
     */
    private static function getNextGeminiKey(array $keys, int $startFrom = null): ?string
    {
        if (empty($keys)) return null;
        $index = $startFrom ?? (int) Cache::get('gemini_key_index', 0);
        if ($index >= count($keys)) $index = 0;
        return $keys[$index];
    }

    private static function advanceGeminiKey(array $keys): void
    {
        $current = (int) Cache::get('gemini_key_index', 0);
        $next = ($current + 1) % count($keys);
        Cache::put('gemini_key_index', $next, now()->addDay());
    }

    private static function callGemini(string $systemPrompt, string $userMessage, int $maxTokens): string
    {
        $keys = static::getGeminiKeys();
        if (empty($keys)) return 'Erreur: Aucune cle API Gemini configuree.';

        $model = Setting::get('gemini_model', 'gemini-2.5-flash');
        $startIndex = (int) Cache::get('gemini_key_index', 0);

        // Try each key, rotating on failure
        for ($attempt = 0; $attempt < count($keys); $attempt++) {
            $keyIndex = ($startIndex + $attempt) % count($keys);
            $apiKey = $keys[$keyIndex];

            $response = Http::timeout(60)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
                    'contents' => [['parts' => [['text' => $userMessage]]]],
                    'generationConfig' => ['maxOutputTokens' => $maxTokens, 'temperature' => 0.7],
                ]
            );

            if ($response->successful()) {
                // Advance to next key for next request (round-robin)
                Cache::put('gemini_key_index', ($keyIndex + 1) % count($keys), now()->addDay());
                return $response->json('candidates.0.content.parts.0.text') ?? 'Desole, je n\'ai pas pu repondre.';
            }

            $status = $response->status();
            $error = $response->json('error.message') ?? '';

            // If quota exceeded or rate limited, try next key
            if ($status === 429 || $status === 403 || str_contains($error, 'quota') || str_contains($error, 'rate')) {
                continue;
            }

            // For other errors, don't rotate
            return 'Erreur API: ' . ($error ?: "Erreur HTTP {$status}");
        }

        return 'Erreur: Toutes les cles API Gemini ont atteint leur limite. Reessayez plus tard.';
    }
}
