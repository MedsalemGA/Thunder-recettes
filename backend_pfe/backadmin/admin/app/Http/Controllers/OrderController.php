<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Produit;
use App\Models\Recette;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Créer une commande à partir d'une recette (Smart Order)
     */
    public function smartOrder(Request $request): JsonResponse
    {
        $request->validate([
            'recipe_id' => 'required|exists:recettes,id',
            'adresse_livraison' => 'required|string',
        ]);

        $user = Auth::user();
        $client = $user->client;

        if (!$client) {
            return response()->json(['message' => 'Client non trouvé'], 404);
        }

        $recette = Recette::findOrFail($request->recipe_id);
        $ingredientsReq = $recette->ingredients; // Array of strings or objects

        // Chercher les produits correspondant aux ingrédients
        $orderItems = [];
        $totalProduits = 0;
        $missingIngredients = [];

        foreach ($ingredientsReq as $ing) {
            // On cherche par nom (insensible à la casse)
            // ing peut être un string ou un objet {ingredientId: '...', quantity: ...}
            $ingName = is_string($ing) ? $ing : ($ing['nom'] ?? $ing['ingredientId'] ?? null);
            $ingQty = is_array($ing) ? ($ing['quantity'] ?? 1) : 1;

            if (!$ingName) continue;

            $produit = Produit::where('nom', 'LIKE', '%' . $ingName . '%')
                              ->where('quantite_stock', '>=', $ingQty)
                              ->first();

            if ($produit) {
                $orderItems[] = [
                    'produit' => $produit,
                    'quantite' => $ingQty,
                    'prix' => $produit->prix
                ];
                $totalProduits += ($produit->prix * $ingQty);
            } else {
                $missingIngredients[] = $ingName;
            }
        }

        if (!empty($missingIngredients)) {
            return response()->json([
                'message' => 'Certains ingrédients ne sont pas disponibles chez nos fournisseurs.',
                'missing' => $missingIngredients
            ], 422);
        }

        // Créer la commande
        try {
            DB::beginTransaction();

            $fraisLivraison = 7.00;
            $commande = Commande::create([
                'client_id' => $client->id,
                'total' => $totalProduits + $fraisLivraison,
                'frais_livraison' => $fraisLivraison,
                'statut' => 'en_attente',
                'adresse_livraison' => $request->adresse_livraison,
            ]);

            foreach ($orderItems as $item) {
                $commande->produits()->attach($item['produit']->id, [
                    'quantite' => $item['quantite'],
                    'prix_unitaire' => $item['prix']
                ]);

                // Décrémenter le stock
                $item['produit']->decrement('quantite_stock', $item['quantite']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Commande passée avec succès !',
                'commande' => $commande->load('produits')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la commande: ' . $e->getMessage()], 500);
        }
    }

    public function myOrders(): JsonResponse
    {
        $client = Auth::user()->client;
        $orders = Commande::where('client_id', $client->id)->with('produits')->latest()->get();
        return response()->json($orders);
    }
}
