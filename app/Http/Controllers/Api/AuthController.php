<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'telephone' => 'nullable|string|max:20',
            'filiere' => 'nullable|string|max:255',
            'niveau' => 'nullable|string|max:10',
            'password' => 'required|min:6|confirmed',
        ]);

        // Auto-map filiere to category
        $categoryId = null;
        if (!empty($data['filiere'])) {
            $category = Category::where('name', $data['filiere'])->first();
            if ($category) {
                $categoryId = $category->id;
            }
        }

        $user = User::create([
            'name' => $data['prenom'] . ' ' . $data['nom'],
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'],
            'telephone' => $data['telephone'] ?? null,
            'filiere' => $data['filiere'] ?? null,
            'niveau' => $data['niveau'] ?? null,
            'category_id' => $categoryId,
            'password' => Hash::make($data['password']),
            'role' => 'student',
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['Identifiants incorrects.']]);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('category:id,name,icon');
        return response()->json(['user' => $user]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'filiere' => 'nullable|string|max:255',
            'niveau' => 'nullable|string|max:10',
        ]);

        if (isset($data['name'])) {
            $user->name = $data['name'];
            $parts = explode(' ', $data['name'], 2);
            $user->prenom = $parts[0] ?? '';
            $user->nom = $parts[1] ?? '';
        }

        if (array_key_exists('filiere', $data)) {
            $user->filiere = $data['filiere'];
            // Auto-map to category
            $category = $data['filiere'] ? Category::where('name', $data['filiere'])->first() : null;
            $user->category_id = $category?->id;
        }

        if (array_key_exists('niveau', $data)) {
            $user->niveau = $data['niveau'];
        }

        $user->save();
        $user->load('category:id,name,icon');

        return response()->json(['user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Deconnecte']);
    }
}
