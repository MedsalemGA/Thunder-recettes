<?php

namespace App\Http\Controllers;

use App\Models\RecipePreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    /**
     * Vérifie si l'utilisateur connecté a déjà rempli le questionnaire.
     */
    public function check(Request $request): JsonResponse
    {
        $completed = RecipePreference::where('user_id', $request->user()->id)->exists();

        return response()->json(['completed' => $completed]);
    }

    /**
     * Sauvegarde (ou met à jour) les préférences de l'utilisateur connecté.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cuisine_preference'        => 'nullable|string|max:100',
            'objectif_alimentaire'      => 'nullable|string|max:100',
            'niveau_activite'           => 'nullable|string|max:100',
            'restrictions_alimentaires' => 'nullable|string|max:100',
            'niveau_difficulte'         => 'nullable|string|max:100',
            'budget'                    => 'nullable|string|max:100',
            'temps_cuisine'             => 'nullable|string|max:100',
            'type_plat'                 => 'nullable|string|max:100',
            'nb_personnes'              => 'nullable|string|max:100',
            'allergies'                 => 'nullable|string|max:255',
        ]);

        $validated['user_id'] = $request->user()->id;

        RecipePreference::updateOrCreate(
            ['user_id' => $validated['user_id']],
            $validated
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Préférences enregistrées avec succès.',
        ]);
    }

    /**
     * Retourne les préférences de l'utilisateur connecté.
     */
    public function show(Request $request): JsonResponse
    {
        $prefs = RecipePreference::where('user_id', $request->user()->id)->first();

        if (!$prefs) {
            return response()->json(['completed' => false, 'data' => null]);
        }

        return response()->json(['completed' => true, 'data' => $prefs]);
    }
}

