<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Recette;
use App\Models\Produit;

class SearchController extends Controller
{
    /**
     * Recherche globale (recettes et produits)
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        
        if (empty($query)) {
            return response()->json([]);
        }

        // 1. Recherche dans les recettes
        $recipes = Recette::where('name', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->orWhere('cuisine', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($recipe) {
                return [
                    'id'    => $recipe->id,
                    'name'  => $recipe->name,
                    'meta'  => $recipe->cuisine . ' • ' . $recipe->difficulty,
                    'type'  => 'recipe',
                    'emoji' => '🍳',
                    'color' => '#0ae1cc',
                    'route' => '/recipes/' . $recipe->id
                ];
            });

        // 2. Recherche dans les produits (marché)
        $products = Produit::where('nom', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id'    => $product->id,
                    'name'  => $product->nom,
                    'meta'  => number_format($product->prix, 2) . ' DT',
                    'type'  => 'product',
                    'emoji' => '📦',
                    'color' => '#FFE66D',
                    'route' => '/market/product/' . $product->id
                ];
            });

        // Fusionner et retourner
        return response()->json($recipes->concat($products));
    }
}
