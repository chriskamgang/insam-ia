<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityMessage;
use App\Models\Specialite;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    /**
     * Build channel slug from a name.
     */
    private function buildChannel(?string $name, ?string $suffix = null): ?string
    {
        if (!$name) return null;
        $slug = strtolower(str_replace(' ', '-', trim($name)));
        if ($suffix) {
            $slug .= '-' . strtoupper(trim($suffix));
        }
        return $slug;
    }

    /**
     * Get available channels for the user (speciality channels + general).
     * Each speciality automatically has its own forum channel.
     */
    public function channels(Request $request)
    {
        $user = $request->user();
        $myChannel = $this->buildChannel($user->filiere, $user->niveau);

        $channels = [];

        // User's own speciality + level channel
        if ($myChannel) {
            $channels[] = [
                'slug' => $myChannel,
                'name' => ($user->filiere ?? 'Ma specialite') . ' - ' . ($user->niveau ?? ''),
                'type' => 'specialite',
                'count' => CommunityMessage::where('channel', $myChannel)->count(),
            ];
        }

        // All speciality channels (auto-created from specialites table)
        $specialites = Specialite::orderBy('name')->get();
        foreach ($specialites as $spec) {
            $slug = $this->buildChannel($spec->name);
            if ($slug && $slug !== $myChannel) {
                $channels[] = [
                    'slug' => $slug,
                    'name' => $spec->name,
                    'type' => 'specialite',
                    'count' => CommunityMessage::where('channel', $slug)->count(),
                ];
            }
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
