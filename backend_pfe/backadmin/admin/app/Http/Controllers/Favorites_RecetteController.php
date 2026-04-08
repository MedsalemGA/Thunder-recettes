<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Favorite_Recette;
use Illuminate\Support\Facades\Auth;


class Favorites_RecetteController extends Controller
{
    // 🔹 Retourne tous les favoris du client connecté
    public function index()
    {
        $userId = Auth::id();

        $favorites = Favorite_Recette::with('recette') // charge les infos de la recette
            ->where('id_client', $userId)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $favorites
        ]);
    }

    // 🔹 Ajouter une recette aux favoris
    public function store(Request $request)
    {
        $userId = Auth::id();
        $recetteId = $request->input('id_recette');

        // vérifier si la recette est déjà en favoris
        $exists = Favorite_Recette::where('id_client', $userId)
            ->where('id_recette', $recetteId)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cette recette est déjà en favoris.'
            ], 400);
        }

        $favorite = Favorite_Recette::create([
            'id_client' => $userId,
            'id_recette' => $recetteId
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $favorite
        ]);
    }

    // 🔹 Optionnel : supprimer un favori
    public function destroy($recetteId)
    {
        $userId = Auth::id();

        Favorite_Recette::where('id_client', $userId)
            ->where('id_recette', $recetteId)
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Favori supprimé.'
        ]);
    }
}