<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityMessage;
use App\Models\Category;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    /**
     * Build channel slug from filiere + niveau.
     */
    private function buildChannel(?string $filiere, ?string $niveau): ?string
    {
        if (!$filiere) return null;
        $slug = strtolower(str_replace(' ', '-', trim($filiere)));
        if ($niveau) {
            $slug .= '-' . strtoupper(trim($niveau));
        }
        return $slug;
    }

    /**
     * Get available channels for the user (their own + general).
     */
    public function channels(Request $request)
    {
        $user = $request->user();
        $myChannel = $this->buildChannel($user->filiere, $user->niveau);
        $filiereChannel = $this->buildChannel($user->filiere, null);

        $channels = [];

        if ($myChannel) {
            $channels[] = [
                'slug' => $myChannel,
                'name' => ($user->filiere ?? 'Ma filiere') . ' - ' . ($user->niveau ?? ''),
                'type' => 'filiere_niveau',
                'count' => CommunityMessage::where('channel', $myChannel)->count(),
            ];
        }

        if ($filiereChannel && $filiereChannel !== $myChannel) {
            $channels[] = [
                'slug' => $filiereChannel,
                'name' => $user->filiere ?? 'Ma filiere',
                'type' => 'filiere',
                'count' => CommunityMessage::where('channel', $filiereChannel)->count(),
            ];
        }

        // General channel
        $channels[] = [
            'slug' => 'general',
            'name' => 'General INSAM',
            'type' => 'general',
            'count' => CommunityMessage::where('channel', 'general')->count(),
        ];

        return response()->json(['channels' => $channels, 'my_channel' => $myChannel]);
    }

    /**
     * Get messages for a channel.
     */
    public function messages(Request $request, $channel)
    {
        $messages = CommunityMessage::with(['user:id,name,prenom,nom,filiere,niveau', 'replies' => function ($q) {
                $q->with('user:id,name,prenom,nom,filiere,niveau')->latest()->limit(50);
            }])
            ->where('channel', $channel)
            ->whereNull('parent_id')
            ->latest()
            ->paginate(30);

        return response()->json($messages);
    }

    /**
     * Post a message.
     */
    public function send(Request $request, $channel)
    {
        $request->validate([
            'content' => 'required|string|max:2000',
            'parent_id' => 'nullable|exists:community_messages,id',
        ]);

        $message = CommunityMessage::create([
            'user_id' => $request->user()->id,
            'channel' => $channel,
            'content' => $request->content,
            'parent_id' => $request->parent_id,
        ]);

        $message->load('user:id,name,prenom,nom,filiere,niveau');

        return response()->json(['message' => $message], 201);
    }

    /**
     * Delete own message.
     */
    public function destroy(Request $request, $id)
    {
        $message = CommunityMessage::where('user_id', $request->user()->id)->findOrFail($id);
        $message->delete();

        return response()->json(['message' => 'Supprime']);
    }
}
