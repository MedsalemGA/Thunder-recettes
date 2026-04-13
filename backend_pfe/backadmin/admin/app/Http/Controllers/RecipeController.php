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
    $recettes = Recette::with('ingredients.produit.variantes', 'ratings.client')->get()->map(function ($r) {

        // Préparer les ingrédients enrichis avec calories_100g et calories par ingrédient
        $ingredientsEnrichis = $r->ingredients->map(function ($ing) {
            $variantes = $ing->produit?->variantes ?? collect();

            // Variante la moins chère (pour affichage prix unitaire)
            $varianteMeilleur = $variantes->sortBy('prix')->first();

            // Coût logique : paquet(s) le moins cher couvrant la quantité requise
            $ingredientCost = $this->calculateIngredientCost(
                (float)$ing->quantite,
                (string)($ing->unite ?? 'g'),
                $variantes
            );

            // calories_100g stocké directement dans recette_ingredients
            $cal100g = (float)($ing->calories_100g ?? 0);

            return [
                'nom'             => $ing->nom_ingredient,
                'quantite'        => $ing->quantite,
                'unite'           => $ing->unite,
                'produit_id'      => $ing->produit_id,
                'disponible'      => $ing->produit?->quantite_stock > 0,
                'price_ing'       => $varianteMeilleur?->prix ?? 0,
                'ingredient_cost' => $ingredientCost,
                'calories_100g'   => $cal100g,
                'calories'        => round($cal100g * (float)$ing->quantite / 100, 1),
                'variantes'       => $variantes->map(fn($v) => [
                    'id'       => $v->id,
                    'quantite' => $v->quantite,
                    'unite'    => $v->unite,
                    'prix'     => $v->prix,
                ])->values(),
            ];
        });

        // Calories totales
        $caloriesTotales = round($ingredientsEnrichis->sum('calories'), 1);

        // Prix dynamique : somme des coûts logiques par ingrédient
        $prixDynamique = round(
    $ingredientsEnrichis
        ->where('disponible', true)
        ->sum('ingredient_cost'),
    2
);

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
            'rating'       => round($r->ratings->avg('rate') ?? 0, 1),
            'instructions' => $r->instructions,
            'price'        => $prixDynamique,
            'calories'     => $caloriesTotales,
            'ingredients'  => $ingredientsEnrichis->values(),
        ];
    });

    return response()->json($recettes);
}

    public function show($id): JsonResponse
    {
        // On charge produit pour que l'accessor calories_totales puisse lire produit.calories_100g
        $recette = Recette::with(['ingredients.produit.fournisseur', 'ingredients.produit.variantes', 'ratings.client'])->findOrFail($id);

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
            'rating'       => round($recette->ratings->avg('rate') ?? 0, 1),
            'vote_count'   => $recette->ratings->count(),
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

            // calories_100g stocké directement dans recette_ingredients
            $cal100g = (float)($ing->calories_100g ?? 0);

            // Charger les variantes pour chaque offre (1 requête)
            $produitIds      = $offres->pluck('id');
            $toutesVariantes = DB::table('produit_variantes')
                ->whereIn('produit_id', $produitIds)
                ->orderBy('prix', 'asc')
                ->get()
                ->groupBy('produit_id');

            $meilleurVariantes = $meilleur ? ($toutesVariantes[$meilleur->id] ?? collect()) : collect();

            // Coût logique : paquet(s) le moins cher du meilleur fournisseur couvrant la quantité
            $meilleurCost = $this->calculateIngredientCost(
                (float)$ing->quantite,
                (string)($ing->unite ?? 'g'),
                $meilleurVariantes
            );
            // Fallback si aucune variante compatible
            if ($meilleurCost === 0.0 && $meilleur !== null) {
                $meilleurCost = (float)$meilleur->prix;
            }

            return [
                'nom'           => $ing->nom_ingredient,
                'quantite'      => $ing->quantite,
                'unite'         => $ing->unite,
                'calories_100g' => $cal100g,
                'calories'      => round($cal100g * (float)$ing->quantite / 100, 1),
                'disponible'    => $dispo->isNotEmpty(),
                'meilleur_prix' => $meilleurCost,
                'meilleur_produit' => $meilleur ? [
                    'id'                => $meilleur->id,
                    'prix'              => $meilleurCost,
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

    /**
     * Calcule le coût réel d'un ingrédient en trouvant la combinaison de paquets
     * la moins chère qui couvre la quantité nécessaire.
     *
     * Exemple : besoin de 100 g, variantes [200 g → 2 DT, 1 kg → 7 DT]
     *   → 1 paquet × 200 g = 2 DT  (plus économique que 1 × 1 kg = 7 DT)
     *
     * @param float  $neededQty  Quantité requise par la recette
     * @param string $neededUnit Unité requise (g, kg, ml, l, …)
     * @param \Illuminate\Support\Collection $variantes  Objets avec ->quantite, ->unite, ->prix
     * @return float Coût optimal en DT
     */
    private function calculateIngredientCost(float $neededQty, string $neededUnit, $variantes): float
    {
        if ($neededQty <= 0 || $variantes->isEmpty()) return 0.0;

        $neededUnit = strtolower(trim($neededUnit));
        $bestCost   = PHP_FLOAT_MAX;

        foreach ($variantes as $v) {
            $varQty  = (float)($v->quantite ?? 0);
            $varUnit = strtolower(trim($v->unite ?? ''));
            $varPrix = (float)($v->prix ?? 0);

            if ($varQty <= 0 || $varPrix <= 0) continue;

            // Normalise vers la même unité de base
            $neededNorm = $neededQty;
            $varNorm    = $varQty;

            if     ($neededUnit === 'g'  && $varUnit === 'kg') { $varNorm    = $varQty * 1000; }
            elseif ($neededUnit === 'kg' && $varUnit === 'g')  { $neededNorm = $neededQty * 1000; }
            elseif ($neededUnit === 'ml' && $varUnit === 'l')  { $varNorm    = $varQty * 1000; }
            elseif ($neededUnit === 'l'  && $varUnit === 'ml') { $neededNorm = $neededQty * 1000; }
            elseif ($neededUnit !== $varUnit)                  { continue; }

            $numPacks = (int)ceil($neededNorm / $varNorm);
            $cost     = $numPacks * $varPrix;

            if ($cost < $bestCost) {
                $bestCost = $cost;
            }
        }

        return $bestCost === PHP_FLOAT_MAX ? 0.0 : round($bestCost, 2);
    }
    public function getalldispo(){
        $ingredient=Produit::with('variantes')->where('quantite_stock', '>', 0)->get();
        return $ingredient->toArray();
    }
}