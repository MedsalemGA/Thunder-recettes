<?php
namespace App\Http\Controllers;

use App\Models\Recette;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function getIngredientDetails(Request $request): JsonResponse
    {
        $name = $request->query('name');
        if (!$name) {
            return response()->json(['message' => 'Nom d\'ingrédient requis'], 400);
        }

        $produit = Produit::where('nom', 'LIKE', '%' . $name . '%')->first();

        if (!$produit) {
            return response()->json([
                'id'          => $name,
                'name'        => $name,
                'price'       => 0,
                'available'   => false,
                'image'       => null,
                'description' => null,
                'quantity'    => 0,
            ]);
        }

        return response()->json([
            'id'          => $produit->id,
            'name'        => $produit->nom,
            'price'       => $produit->prix,
            'available'   => $produit->quantite_stock > 0,
            'image'       => $produit->image,
            'description' => $produit->description,
            'quantity'    => $produit->quantite_stock,
        ]);
    }

    public function index(): JsonResponse
{
    $recettes = Recette::with('ingredients.produit.variantes')->get()->map(function ($r) {

        // Préparer les ingrédients enrichis avec calories_100g et calories par ingrédient
        $ingredientsEnrichis = $r->ingredients->map(function ($ing) {
            $variantes = $ing->produit?->variantes ?? collect();

            // Variante la moins chère comme prix de référence
            $varianteMeilleur = $variantes->sortBy('prix')->first();

            // calories_100g : depuis recette_ingredients en priorité, sinon depuis produit
            $cal100g = (float)$ing->calories_100g;
            if ($cal100g === 0.0 && $ing->produit !== null) {
                $cal100g = (float)$ing->produit->calories_100g;
            }

            return [
                'nom'           => $ing->nom_ingredient,
                'quantite'      => $ing->quantite,
                'unite'         => $ing->unite,
                'disponible'    => $ing->produit?->quantite_stock > 0,
                'price_ing'     => $varianteMeilleur?->prix ?? 0,
                'calories_100g' => $cal100g,
                'calories'      => round($cal100g * (float)$ing->quantite / 100, 1),
                'variantes'     => $variantes->map(fn($v) => [
                    'id'       => $v->id,
                    'quantite' => $v->quantite,
                    'unite'    => $v->unite,
                    'prix'     => $v->prix,
                ])->values(),
            ];
        });

        // Calories totales = somme des calories par ingrédient
        $caloriesTotales = round($ingredientsEnrichis->sum('calories'), 1);

        return [
            'id'           => $r->id,
            'name'         => $r->nom,
            'description'  => $r->description,
            'image'        => $r->image,
            'cuisine'      => $r->categorie ?? 'Tunisienne',
            'difficulty'   => $r->difficulte ?? 'medium',
            'prepTime'     => $r->temps_preparation,
            'cookTime'     => $r->temps_cuisson,
            'servings'     => $r->nombre_personnes,
            'rating'       => $r->rating ?? 4.5,
            'instructions' => $r->instructions,
            'price'        => $r->prix,
            'calories'     => $caloriesTotales,
            'ingredients'  => $ingredientsEnrichis->values(),
        ];
    });

    return response()->json($recettes);
}

    public function show($id): JsonResponse
    {
        // On charge produit pour que l'accessor calories_totales puisse lire produit.calories_100g
        $recette = Recette::with(['ingredients.produit.fournisseur', 'ingredients.produit.variantes'])->findOrFail($id);

        $ingredientsEnrichis = $this->resolveIngredients($recette);

        return response()->json([
            'id'           => $recette->id,
            'nom'          => $recette->nom,
            'description'  => $recette->description,
            'image'        => $recette->image,
            'cuisine'      => $recette->categorie,
            'difficulte'   => $recette->difficulte,
            'temps_prep'   => $recette->temps_preparation,
            'temps_cuisson'=> $recette->temps_cuisson,
            'calories'     => $recette->calories_totales, // produit chargé → fallback actif
            'instructions' => $recette->instructions ?? [],
            'rating'       => $recette->rating ?? 0,
            'ingredients'  => $ingredientsEnrichis,
            'cout_total'   => collect($ingredientsEnrichis)->sum(fn($i) => $i['meilleur_prix'] ?? 0),
        ]);
    }

    /**
     * Résout les ingrédients depuis recette_ingredients
     * Cherche les offres multi-fournisseurs pour les ingrédients en stock
     */
    private function resolveIngredients(Recette $recette): array
    {
        return $recette->ingredients->map(function ($ing) {

            // Ingrédient hors stock (pas de produit lié)
            if (!$ing->produit_id) {
                return [
                    'nom'              => $ing->nom_ingredient,
                    'quantite'         => $ing->quantite,
                    'unite'            => $ing->unite,
                    'calories_100g'    => $ing->calories_100g,
                    'calories'         => $ing->calories_ingredient,
                    'disponible'       => false,
                    'meilleur_prix'    => null,
                    'meilleur_produit' => null,
                    'offres'           => [],
                ];
            }

            // Chercher toutes les offres multi-fournisseurs pour ce nom d'ingrédient
            $offres = Produit::with('variantes')
                ->select(
                    'produits.id',
                    'produits.nom',
                    'produits.prix',
                    'produits.quantite_stock',
                    'produits.calories_100g',
                    'produits.image',
                    'produits.fournisseur_id',
                    'fournisseurs.nom as fournisseur_nom',
                    'fournisseurs.ville as fournisseur_ville',
                )
                ->join('fournisseurs', 'fournisseurs.id', '=', 'produits.fournisseur_id')
                ->where(DB::raw('LOWER(produits.nom)'), strtolower($ing->nom_ingredient))
                ->orderBy('produits.prix', 'asc')
                ->get();

            $dispo    = $offres->where('quantite_stock', '>', 0);
            $meilleur = $dispo->sortBy('prix')->first();

            // calories_100g : depuis recette_ingredients ou depuis le produit trouvé
            $cal100g = (float)$ing->calories_100g;
            if ($cal100g === 0.0 && $meilleur !== null) {
                $cal100g = (float)$meilleur->calories_100g;
            }

            // Charger les variantes pour chaque offre (1 requête)
            $produitIds      = $offres->pluck('id');
            $toutesVariantes = DB::table('produit_variantes')
                ->whereIn('produit_id', $produitIds)
                ->orderBy('prix', 'asc')
                ->get()
                ->groupBy('produit_id');

            $meilleurVariantes    = $meilleur ? ($toutesVariantes[$meilleur->id] ?? collect()) : collect();
            $meilleurVariantePrix = $meilleurVariantes->sortBy('prix')->first()?->prix ?? $meilleur?->prix;

            return [
                'nom'           => $ing->nom_ingredient,
                'quantite'      => $ing->quantite,
                'unite'         => $ing->unite,
                'calories_100g' => $cal100g,
                'calories'      => round($cal100g * (float)$ing->quantite / 100, 1),
                'disponible'    => $dispo->isNotEmpty(),
                'meilleur_prix' => $meilleurVariantePrix,
                'meilleur_produit' => $meilleur ? [
                    'id'                => $meilleur->id,
                    'prix'              => $meilleurVariantePrix,
                    'quantite_stock'    => $meilleur->quantite_stock,
                    'image'             => $meilleur->image,
                    'fournisseur_id'    => $meilleur->fournisseur_id,
                    'fournisseur_nom'   => $meilleur->fournisseur_nom,
                    'fournisseur_ville' => $meilleur->fournisseur_ville,
                    'variantes'         => $meilleurVariantes->map(fn($v) => [
                        'id'       => $v->id,
                        'quantite' => $v->quantite,
                        'unite'    => $v->unite,
                        'prix'     => $v->prix,
                    ])->values(),
                ] : null,
                'offres' => $offres->values()->map(function ($p) use ($toutesVariantes, $meilleur) {
                    $variantes = $toutesVariantes[$p->id] ?? collect();
                    return [
                        'id'                => $p->id,
                        'prix'              => $p->prix,
                        'quantite_stock'    => $p->quantite_stock,
                        'image'             => $p->image,
                        'fournisseur_id'    => $p->fournisseur_id,
                        'fournisseur_nom'   => $p->fournisseur_nom,
                        'fournisseur_ville' => $p->fournisseur_ville,
                        'en_stock'          => $p->quantite_stock > 0,
                        'recommande'        => $meilleur && $p->id === $meilleur->id,
                        'variantes'         => $variantes->map(fn($v) => [
                            'id'       => $v->id,
                            'quantite' => $v->quantite,
                            'unite'    => $v->unite,
                            'prix'     => $v->prix,
                        ])->values(),
                    ];
                })->toArray(),
            ];
        })->toArray();
    }
}