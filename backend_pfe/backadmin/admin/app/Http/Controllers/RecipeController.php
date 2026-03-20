<?php

namespace App\Http\Controllers;

use App\Models\Recette;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function getIngredientDetails(Request $request): JsonResponse
    {
        $name = $request->query('name');
        if (!$name) {
            return response()->json(['message' => 'Nom d\'ingrédient requis'], 400);
        }

        // On cherche dans la table produits (qui fait office de table ingrédients)
        $produit = Produit::where('nom', 'LIKE', '%' . $name . '%')->first();

        if (!$produit) {
            return response()->json([
                'id' => $name,
                'name' => $name,
                'price' => 0,
                'available' => false,
                'image' => null
            ]);
        }

        return response()->json([
            'id' => $produit->id,
            'name' => $produit->nom,
            'price' => $produit->prix,
            'available' => $produit->quantite_stock > 0,
            'image' => $produit->image,
            'description' => $produit->description
        ]);
    }

    public function index(): JsonResponse
    {
        $recettes = Recette::all()->map(function($r) {
            return [
                'id' => $r->id,
                'name' => $r->nom,
                'description' => $r->description,
                'image' => $r->image,
                'cuisine' => $r->categorie ?? 'Tunisienne',
                'difficulty' => $r->difficulte ?? 'medium',
                'prepTime' => $r->temps_preparation,
                'cookTime' => $r->temps_cuisson,
                'servings' => $r->nombre_personnes,
                'rating' => $r->rating ?? 4.5,
                'ingredients' => $r->ingredients,
                'instructions' => $r->instructions,
            ];
        });
        return response()->json($recettes);
    }

    public function show($id)
    {
        $recette = Recette::findOrFail($id);
 
        // ingredients est stocké comme JSON array de noms ["tomate", "sel", ...]
        $ingredientNames = is_array($recette->ingredients)
            ? $recette->ingredients
            : json_decode($recette->ingredients, true) ?? [];
 
        $ingredientsEnrichis = $this->resolveIngredients($ingredientNames);
 
        return response()->json([
            'id'              => $recette->id,
            'nom'             => $recette->nom,
            'description'     => $recette->description,
            'image'           => $recette->image,
            'cuisine'         => $recette->cuisine,
            'difficulte'      => $recette->difficulte,
            'temps_prep'      => $recette->temps_prep,
            'temps_cuisson'   => $recette->temps_cuisson,
            'portions'        => $recette->portions,
            'instructions'    => is_array($recette->instructions)
                                    ? $recette->instructions
                                    : json_decode($recette->instructions, true) ?? [],
            'note'            => $recette->note ?? 0,
            'avis'            => $recette->avis ?? 0,
            'ingredients'     => $ingredientsEnrichis,
            'cout_total'      => collect($ingredientsEnrichis)
                                    ->sum(fn($i) => $i['meilleur_prix'] ?? 0),
        ]);
    }
 
    /**
     * Pour chaque nom d'ingrédient, trouve tous les produits correspondants
     * dans la table produits (multi-fournisseurs) et retourne le moins cher.
     */
    private function resolveIngredients(array $names): array
    {
        if (empty($names)) return [];
 
        // Récupérer tous les produits dont le nom correspond (insensible à la casse)
        // + le nom du fournisseur en join
        $produits = Produit::query()
            ->select(
                'produits.id',
                'produits.nom',
                'produits.description',
                'produits.prix',
                'produits.quantite_stock',
                'produits.image',
                'produits.fournisseur_id',
                'fournisseurs.nom as fournisseur_nom',
                'fournisseurs.ville as fournisseur_ville',
            )
            ->join('fournisseurs', 'fournisseurs.id', '=', 'produits.fournisseur_id')
            ->whereIn(
                DB::raw('LOWER(produits.nom)'),
                array_map('strtolower', $names)
            )
            ->orderBy('produits.prix', 'asc')
            ->get();
 
        // Grouper par nom normalisé
        $grouped = $produits->groupBy(fn($p) => strtolower($p->nom));
 
        $result = [];
 
        foreach ($names as $name) {
            $key      = strtolower($name);
            $offres   = $grouped->get($key, collect());
            $dispo    = $offres->where('quantite_stock', '>', 0);
            $meilleur = $dispo->sortBy('prix')->first(); // moins cher en stock
 
            $result[] = [
                'nom'              => $name,
                'disponible'       => $dispo->isNotEmpty(),
                'meilleur_prix'    => $meilleur?->prix,
                'meilleur_produit' => $meilleur ? [
                    'id'              => $meilleur->id,
                    'prix'            => $meilleur->prix,
                    'quantite_stock'  => $meilleur->quantite_stock,
                    'image'           => $meilleur->image,
                    'fournisseur_id'  => $meilleur->fournisseur_id,
                    'fournisseur_nom' => $meilleur->fournisseur_nom,
                    'fournisseur_ville' => $meilleur->fournisseur_ville,
                ] : null,
                // Toutes les offres (pour afficher les alternatives)
                'offres'           => $offres->values()->map(fn($p) => [
                    'id'              => $p->id,
                    'prix'            => $p->prix,
                    'quantite_stock'  => $p->quantite_stock,
                    'image'           => $p->image,
                    'fournisseur_id'  => $p->fournisseur_id,
                    'fournisseur_nom' => $p->fournisseur_nom,
                    'fournisseur_ville' => $p->fournisseur_ville,
                    'en_stock'        => $p->quantite_stock > 0,
                    'recommande'      => $meilleur && $p->id === $meilleur->id,
                ])->toArray(),
            ];
        }
 
        return $result;
    }
}