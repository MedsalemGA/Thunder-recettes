<?php
// app/Http/Controllers/Client/ProfileController.php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════
    // GET PROFILE
    // GET /api/client/user/profile
    // ══════════════════════════════════════════════════════════════════════
    public function getProfile(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()
        ], 200);
    }

    // ══════════════════════════════════════════════════════════════════════
    // UPDATE PROFILE
    // POST /api/client/user/profile
    // ══════════════════════════════════════════════════════════════════════
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'telephone' => 'sometimes|string',
            'adresse'   => 'sometimes|string',
            'password'  => 'sometimes|nullable|string|min:6|confirmed',
        ]);

        if (isset($validated['password']) && !empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user'    => $user
        ], 200);
    }

    // ══════════════════════════════════════════════════════════════════════
    // DELETE ACCOUNT
    // DELETE /api/client/user/account
    // ══════════════════════════════════════════════════════════════════════
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        // On peut demander le mot de passe pour confirmer
        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 403);
        }

        // Supprimer le client lié
        if ($user->client) {
            $user->client->delete();
        }

        // Supprimer les tokens et le user
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Compte supprimé avec succès.'], 200);
    }
}