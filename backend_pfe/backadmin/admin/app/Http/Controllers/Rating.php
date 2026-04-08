<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\RecipeRating;
use App\Models\Recette;

class Rating extends Controller
{
    /**
     * POST /client/recipes/{id}/rate
     * Enregistre ou met à jour la note du client connecté pour une recette.
     */
    public function store(Request $request, $id): JsonResponse
    {
        $request->validate([
            'rate' => 'required|integer|min:1|max:5',
        ]);

        $client = $request->user()->client;

        // updateOrCreate évite les doublons (unique constraint)
        $rating = RecipeRating::updateOrCreate(
            ['client_id' => $client->id, 'recette_id' => $id],
            ['rate'      => $request->rate]
        );

        // Recalculer la moyenne après la note
        $recette = Recette::withCount('ratings')->find($id);
        $avg = RecipeRating::where('recette_id', $id)->avg('rate');

        return response()->json([
            'message'    => 'Note enregistrée',
            'user_rate'  => $rating->rate,
            'avg_rating' => round($avg, 1),
            'count'      => RecipeRating::where('recette_id', $id)->count(),
        ]);
    }

    /**
     * GET /client/recipes/{id}/rating
     * Retourne la note du client connecté + la moyenne globale.
     */
    public function getUserRating(Request $request, $id): JsonResponse
    {
        $client    = $request->user()->client;
        $userRating = RecipeRating::where('client_id', $client->id)
                                  ->where('recette_id', $id)
                                  ->value('rate');

        $avg   = RecipeRating::where('recette_id', $id)->avg('rate');
        $count = RecipeRating::where('recette_id', $id)->count();

        return response()->json([
            'user_rate'  => $userRating,          // null si pas encore noté
            'avg_rating' => round($avg ?? 0, 1),
            'count'      => $count,
        ]);
    }
}
