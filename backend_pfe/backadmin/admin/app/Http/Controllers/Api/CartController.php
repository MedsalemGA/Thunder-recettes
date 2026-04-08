<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Carte;
use App\Models\CarteItem;
use App\Models\Produit;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    // ── GET /client/panier ───────────────────────────────────────────────────
    public function getCart(): JsonResponse
    {
        $user  = Auth::user();
        $carte = Carte::with(['items.produit', 'items.recette'])
                      ->where('client_id', $user->id)
                      ->first();

        if (!$carte) {
            return response()->json(['items' => [], 'amount' => 0]);
        }

        $carte->load('items.produit');
        $carte->recalculerMontant();

        return response()->json([
            'id'     => $carte->id,
            'amount' => (float) $carte->amount,
            'items'  => $carte->items->map(fn($item) => $this->formatItem($item)),
        ]);
    }

    // ── POST /client/panier/items ────────────────────────────────────────────
    /** Ajoute un ou plusieurs ingrédients cochés au panier */
    public function addItems(Request $request): JsonResponse
    {
        $request->validate([
            'items'                  => 'required|array|min:1',
            'items.*.produit_id'     => 'required|exists:produits,id',
            'items.*.nom_ingredient' => 'required|string',
            'items.*.quantite'       => 'required|numeric|min:0.01',
            'items.*.unite'          => 'required|string',
            'items.*.recette_id'     => 'nullable|exists:recettes,id',
        ]);

        $user  = Auth::user();
        $carte = Carte::firstOrCreate(
            ['client_id' => $user->id],
            ['amount'    => 0]
        );

        foreach ($request->items as $data) {
            $produit = Produit::find($data['produit_id']);
            $prix    = $produit ? (float) $produit->prix : 0;

            // Si le même produit pour la même recette existe déjà → on incrémente
            $existing = CarteItem::where('carte_id',   $carte->id)
                                 ->where('produit_id', $data['produit_id'])
                                 ->where('recette_id', $data['recette_id'] ?? null)
                                 ->first();

            if ($existing) {
                $existing->quantite += (float) $data['quantite'];
                $existing->save();
            } else {
                CarteItem::create([
                    'carte_id'      => $carte->id,
                    'produit_id'    => $data['produit_id'],
                    'recette_id'    => $data['recette_id'] ?? null,
                    'nom_ingredient'=> $data['nom_ingredient'],
                    'quantite'      => $data['quantite'],
                    'unite'         => $data['unite'],
                    'prix_unitaire' => $prix,
                ]);
            }
        }

        $carte->load('items');
        $carte->recalculerMontant();

        return response()->json(['message' => 'Articles ajoutés au panier', 'amount' => (float) $carte->amount], 201);
    }

    // ── PATCH /client/panier/items/{id} ─────────────────────────────────────
    public function updateItem(Request $request, int $id): JsonResponse
    {
        $request->validate(['quantite' => 'required|numeric|min:0']);

        $item = CarteItem::findOrFail($id);
        $this->authorizeItem($item);

        if ((float) $request->quantite <= 0) {
            $carte = $item->carte;
            $item->delete();
            $carte->load('items');
            $carte->recalculerMontant();
            return response()->json(['message' => 'Article supprimé', 'amount' => (float) $carte->amount]);
        }

        $item->quantite = $request->quantite;
        $item->save();

        $carte = $item->carte;
        $carte->load('items');
        $carte->recalculerMontant();

        return response()->json(['message' => 'Quantité mise à jour', 'item' => $this->formatItem($item), 'amount' => (float) $carte->amount]);
    }

    // ── DELETE /client/panier/items/{id} ────────────────────────────────────
    public function removeItem(int $id): JsonResponse
    {
        $item  = CarteItem::findOrFail($id);
        $this->authorizeItem($item);
        $carte = $item->carte;
        $item->delete();
        $carte->load('items');
        $carte->recalculerMontant();

        return response()->json(['message' => 'Article retiré', 'amount' => (float) $carte->amount]);
    }

    // ── DELETE /client/panier ────────────────────────────────────────────────
    public function clearCart(): JsonResponse
    {
        $user  = Auth::user();
        $carte = Carte::where('client_id', $user->id)->first();

        if ($carte) {
            $carte->items()->delete();
            $carte->amount = 0;
            $carte->save();
        }

        return response()->json(['message' => 'Panier vidé']);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function authorizeItem(CarteItem $item): void
    {
        $userId = Auth::id();
        abort_if($item->carte->client_id !== $userId, 403, 'Accès refusé');
    }

    private function formatItem(CarteItem $item): array
    {
        $produit = $item->produit;
        return [
            'id'             => $item->id,
            'produit_id'     => $item->produit_id,
            'recette_id'     => $item->recette_id,
            'recette_nom'    => $item->recette?->nom,
            'nom_ingredient' => $item->nom_ingredient,
            'quantite'       => (float) $item->quantite,
            'unite'          => $item->unite,
            'prix_unitaire'  => (float) $item->prix_unitaire,
            'prix_total'     => round((float) $item->prix_unitaire * (float) $item->quantite, 2),
            'produit'        => $produit ? [
                'id'             => $produit->id,
                'nom'            => $produit->nom,
                'image'          => $produit->image,
                'calories_100g'  => (float) $produit->calories_100g,
                'quantite_stock' => $produit->quantite_stock,
                'prix'           => (float) $produit->prix,
                'description'    => $produit->description,
            ] : null,
        ];
    }
}
