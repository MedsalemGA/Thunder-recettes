<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\User;
use App\Models\Fournisseur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\PersonalAccessToken;
use App\Mail\AdminOtpMail;
use Carbon\Carbon;
use App\Models\Recette;
use App\Models\RecetteIngredient;
use App\Models\Produit;
use App\Models\ProduitVariante;
class AdminController extends Controller
{
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                "usernameOrEmail" => "required|email",
                "password"        => "required"
            ]);

            // 1. Trouver le User par email
            $user = User::where("email", $validated["usernameOrEmail"])->first();

            if (!$user) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Aucun compte trouvé avec cet email"
                ], 401);
            }

            // 2. Vérifier le mot de passe
            if (!Hash::check($validated["password"], $user->password)) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Mot de passe incorrect"
                ], 401);
            }

            // 3. Vérifier que c'est bien un admin
            $admin = Admin::where("user_id", $user->id)->first();

            if (!$admin) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Accès refusé : ce compte n'est pas un administrateur"
                ], 403);
            }

            // 4. Générer un OTP à 6 chiffres et l'enregistrer (valide 10 min)
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $admin->login_otp            = $otp;
            $admin->login_otp_expires_at = Carbon::now()->addMinutes(10);
            $admin->save();

            // 5. Envoyer l'email
            Mail::to($user->email)->send(new AdminOtpMail($otp, $user->name));

            return response()->json([
                "status"  => "otp_required",
                "message" => "Un code de vérification a été envoyé à votre adresse email.",
                "email"   => $user->email,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());

            return response()->json([
                "status"  => "error",
                "message" => "Erreur serveur : " . $e->getMessage()
            ], 500);
        }
    }

    public function verifyOtp(Request $request)
    {
        try {
            $validated = $request->validate([
                "email" => "required|email",
                "otp"   => "required|string|size:6",
            ]);

            $user = User::where("email", $validated["email"])->first();

            if (!$user) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Compte introuvable"
                ], 401);
            }

            $admin = Admin::where("user_id", $user->id)->first();

            if (!$admin) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Accès refusé"
                ], 403);
            }

            // Vérifier expiration
            if (!$admin->login_otp_expires_at || Carbon::now()->isAfter($admin->login_otp_expires_at)) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Le code a expiré. Veuillez vous reconnecter."
                ], 401);
            }

            // Vérifier le code
            if ($admin->login_otp !== $validated["otp"]) {
                return response()->json([
                    "status"  => "error",
                    "message" => "Code incorrect. Veuillez réessayer."
                ], 401);
            }

            // OTP valide — effacer le code et délivrer le token
            $admin->login_otp            = null;
            $admin->login_otp_expires_at = null;
            $admin->save();

            $token = $admin->createToken("auth_token")->plainTextToken;

            return response()->json([
                "status"  => "success",
                "message" => "Connexion réussie",
                "data"    => [
                    "admin" => $user,
                    "token" => $token,
                    "email" => $user->email,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('VerifyOtp error: ' . $e->getMessage());

            return response()->json([
                "status"  => "error",
                "message" => "Erreur serveur : " . $e->getMessage()
            ], 500);
        }
    }

    public function getadmininfo(Request $request)
    {
        $validated = $request->validate([
            "email" => "required|email"
        ]);

        // Trouver le User par email et vérifier qu'il est admin
        $user = User::where("email", $validated["email"])->first();

        if (!$user || !$user->admin) {
            return response()->json([
                "status"  => "error",
                "message" => "Aucun administrateur trouvé avec cet email"
            ], 401);
        }

        return response()->json([
            "status"  => "success",
            "message" => "Admin found",
            "data"    => $user   // contient : name, email, role, photo, adresse
        ], 200);
    }

    public function logout(Request $request)
    {
        // Retrouver le token depuis l'en-tête Authorization Bearer et le supprimer
        $bearerToken = $request->bearerToken();

        if ($bearerToken) {
            $token = PersonalAccessToken::findToken($bearerToken);
            if ($token) {
                $token->delete();
            }
        }

        return response()->json([
            "status"  => "success",
            "message" => "Logout successful"
        ], 200);
    }
public function ajouterfournisseur(Request $request){
    $validated = $request->validate([
        "name" => "required",
        "email" => "required|email",
        "password" => "required",
        "adresse" => "required",
        "telephone" => "required",
        "photo"=> "required",
        "specialite" => "required",
        "code_commercial" => "required",
    ]);
    $user = User::create([
        "name"=> $validated["name"],
        "email"=> $validated["email"],
        "password"=> Hash::make($validated["password"]),
        "adresse"=> $validated["adresse"],
        "telephone"=> $validated["telephone"],
        "photo"=> $validated["photo"],
        "role"=> "fournisseur"
    ]);
    $fournisseur= Fournisseur::create([
        "user_id"=> $user->id,
        "specialite"=> $validated["specialite"],
        "code_commercial"=> $validated["code_commercial"],
    ]);


    return response()->json([
        "status"  => "success",
        "message" => "Fournisseur created successfully",
        "data"    => $fournisseur
    ], 201);}
public function getallfournisseurs()
{
    $fournisseurs = Fournisseur::with(['user', 'produits.variantes'])
        ->whereHas('user', function ($query) {
            $query->where('role', 'fournisseur');
        })
        ->get();

    return response()->json([
        "status"  => "success",
        "message" => "Fournisseurs found",
        "data"    => $fournisseurs,
    ], 200);
}

public function deletefournisseurs(Request $request){
    $fournisseurs = User::findOrFail($request->id);
    $fournisseurs->delete();
    return response()->json([
        "status"  => "success",
        "message" => "Fournisseur deleted",
        "data"    => $fournisseurs,
    ], 200);


}
public function updatefournisseurs(Request $request)
{
    $fournisseur = Fournisseur::findOrFail($request->id);
    $user = $fournisseur->user;

    // mise à jour table users
    $userData = $request->only([
        'name',
        'email',
        'photo',
        'adresse',
        'telephone',
        'password',
        


    ]);

    if (!empty($userData)) {
        $user->update($userData);
    }

    // mise à jour table fournisseurs
    $fournisseurData = $request->only([
        'code_commercial',
        'specialite',
    ]);

    if (!empty($fournisseurData)) {
        $fournisseur->update($fournisseurData);
    }

    return response()->json([
        'message' => 'Fournisseur modifié',
        'fournisseur' => $fournisseur->load('user')
    ]);
}
public function getallrecettes()
{
    // Retourne le même format que RecipeController::index()
    // afin que le frontend Angular reçoive les champs name, cuisine, calories, ingredients structurés
    $recettes = Recette::with('ingredients.produit.variantes')->get()->map(function ($r) {

        $ingredientsEnrichis = $r->ingredients->map(function ($ing) {
            $variantes    = $ing->produit?->variantes ?? collect();
            $varMeilleure = $variantes->sortBy('prix')->first();

            // Coût logique : paquet(s) le moins cher couvrant la quantité requise
            $ingredientCost = $this->calculateIngredientCost(
                (float)$ing->quantite,
                (string)($ing->unite ?? 'g'),
                $variantes
            );

            $cal100g = (float)($ing->calories_100g ?? 0);

            return [
                'nom_ingredient'  => $ing->nom_ingredient,
                'nom'             => $ing->nom_ingredient,
                'quantite'        => $ing->quantite,
                'unite'           => $ing->unite,
                'produit_id'      => $ing->produit_id,
                'disponible'      => $ing->produit?->quantite_stock > 0,
                'price_ing'       => $varMeilleure?->prix ?? 0,
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

        $caloriesTotales = round($ingredientsEnrichis->sum('calories'), 1);

        // Prix dynamique : somme des coûts logiques par ingrédient
        $prixDynamique = round($ingredientsEnrichis->sum('ingredient_cost'), 2);

        return [
            'id'           => $r->id,
            'name'         => $r->nom,
            'nom'          => $r->nom,
            'description'  => $r->description,
            'image'        => $r->image,
            'cuisine'      => $r->categorie,
            'categorie'    => $r->categorie,
            'difficulty'   => $r->difficulte ?? 'medium',
            'difficulte'   => $r->difficulte ?? 'medium',
            'prepTime'     => $r->temps_preparation,
            'temps_preparation' => $r->temps_preparation,
            'cookTime'     => $r->temps_cuisson,
            'temps_cuisson'=> $r->temps_cuisson,
            'servings'     => $r->nombre_personnes,
            'nombre_personnes' => $r->nombre_personnes,
            'rating'       => $r->rating ?? 4.5,
            'prix'         => $prixDynamique,
            'calories'     => $caloriesTotales,
            'instructions' => $r->instructions ?? [],
            'ingredients'  => $ingredientsEnrichis->values(),
        ];
    });

    return response()->json($recettes, 200);
}
public function ajouterrecettes(Request $request){
    $validated = $request->validate([
        'nom'               => 'required|string',
        'description'       => 'required|string',
        'image'             => 'nullable|string',
        'temps_preparation' => 'nullable|integer',
        'temps_cuisson'     => 'nullable|integer',
        'nombre_personnes'  => 'nullable|integer',
        'categorie'         => 'required|string',
        'difficulte'        => 'nullable|string|in:easy,medium,hard',
        'instructions'      => 'nullable|array',
        // ingredients est maintenant un tableau d'objets structurés
        'ingredients'                      => 'nullable|array',
        'ingredients.*.nom_ingredient'     => 'required|string',
        'ingredients.*.quantite'           => 'required|numeric|min:0',
        'ingredients.*.unite'              => 'required|string',
        'ingredients.*.produit_id'         => 'nullable|integer|exists:produits,id',
        'ingredients.*.calories_100g'      => 'nullable|numeric|min:0',
    ]);

    // Créer la recette
    $recette = Recette::create([
        'nom'               => $validated['nom'],
        'description'       => $validated['description'],
        'image'             => $validated['image'] ?? null,
        'temps_preparation' => $validated['temps_preparation'] ?? null,
        'temps_cuisson'     => $validated['temps_cuisson'] ?? null,
        'nombre_personnes'  => $validated['nombre_personnes'] ?? null,
        'categorie'         => $validated['categorie'],
        'difficulte'        => $validated['difficulte'] ?? 'medium',
        'instructions'      => $validated['instructions'] ?? [],
    ]);

    // Insérer les ingrédients avec calories_100g dans recette_ingredients
    foreach ($validated['ingredients'] ?? [] as $ing) {
        $produit = Produit::where('nom', $ing['nom_ingredient'])->first();
        RecetteIngredient::create([
            'recette_id'     => $recette->id,
            'produit_id'     => $ing['produit_id'] ?? ($produit ? $produit->id : null),
            'nom_ingredient' => $ing['nom_ingredient'],
            'quantite'       => $ing['quantite'],
            'unite'          => $ing['unite'],
            'calories_100g'  => $ing['calories_100g'] ?? 0,
        ]);
    }

    return response()->json([
        'status'  => 'success',
        'message' => 'Recette créée avec succès',
        'data'    => $recette->load('ingredients'),
    ], 201);
}
public function updaterecettes(Request $request)
{
    $recette = Recette::findOrFail($request->id);

    // Champs scalaires autorisés (pas ingredients, pas calories)
    $scalaires = $request->only([
        'nom', 'description', 'image', 'categorie', 'difficulte',
        'temps_preparation', 'temps_cuisson', 'nombre_personnes', 'instructions',
    ]);

    if (!empty($scalaires)) {
        $recette->update($scalaires);
    }

  if ($request->has('ingredients')) {
    $recette->ingredients()->delete();

    foreach ($request->input('ingredients', []) as $ing) {

        if (empty($ing['nom_ingredient']) || !isset($ing['quantite'])) continue;

        // priorité au produit_id envoyé (important)
        $produitId = $ing['produit_id'] ?? null;

        // fallback seulement si produit_id absent
        if (!$produitId) {
            $produitId = Produit::where('nom', $ing['nom_ingredient'])->value('id');
        }

        RecetteIngredient::create([
            'recette_id'     => $recette->id,
            'produit_id'     => $produitId,
            'nom_ingredient' => $ing['nom_ingredient'],
            'quantite'       => $ing['quantite'],
            'unite'          => $ing['unite'] ?? 'g',
            'calories_100g'  => $ing['calories_100g'] ?? 0,
        ]);
    }

    }

    return response()->json([
        'status'  => 'success',
        'message' => 'Recette modifiée avec succès',
        'data'    => $recette->load('ingredients'),
    ], 200);
}
public function deleterecettes(Request $request){
    $recettes = Recette::findOrFail($request->id);
    $recettes->delete();
    return response()->json([
        "status"  => "success",
        "message" => "Recette deleted",
        "data"    => $recettes,
    ], 200);
}


    // ══════════════════════════════════════════════════════════════════════
    //  PRODUITS
    // ══════════════════════════════════════════════════════════════════════

    public function getallproduits()
    {
        $produits = Produit::with(['variantes', 'fournisseur'])->get();
        return response()->json($produits, 200);
    }

    public function ajouterproduit(Request $request)
    {
        $validated = $request->validate([
            'nom'            => 'required|string',
            'description'    => 'nullable|string',
            'prix'           => 'required|numeric|min:0',
            'quantite_stock' => 'required|integer|min:0',
            'fournisseur_id' => 'required|integer|exists:fournisseurs,id',
            'image'          => 'nullable|string',
        ]);

        $produit = Produit::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Produit créé avec succès',
            'data'    => $produit,
        ], 201);
    }

    public function updateproduit(Request $request)
    {
        $produit = Produit::findOrFail($request->id);

        $produit->update($request->only([
            'nom', 'description', 'prix', 'quantite_stock', 'image',
        ]));

        return response()->json([
            'status'  => 'success',
            'message' => 'Produit modifié avec succès',
            'data'    => $produit->load('variantes'),
        ], 200);
    }

    public function deleteproduit(Request $request)
    {
        $produit = Produit::findOrFail($request->id);
        $produit->delete(); // CASCADE supprime aussi les variantes

        return response()->json([
            'status'  => 'success',
            'message' => 'Produit supprimé',
        ], 200);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  VARIANTES
    // ══════════════════════════════════════════════════════════════════════

    public function getvariantes(Request $request)
    {
        $variantes = ProduitVariante::where('produit_id', $request->produit_id)
            ->orderBy('prix')
            ->get();

        return response()->json($variantes, 200);
    }

    public function ajoutervariante(Request $request)
    {
        $validated = $request->validate([
            'produit_id' => 'required|integer|exists:produits,id',
            'quantite'   => 'required|numeric|min:0',
            'unite'      => 'required|string',
            'prix'       => 'required|numeric|min:0',
        ]);

        $variante = ProduitVariante::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Variante ajoutée avec succès',
            'data'    => $variante,
        ], 201);
    }

    public function updatevariante(Request $request)
    {
        $variante = ProduitVariante::findOrFail($request->id);

        $variante->update($request->only(['quantite', 'unite', 'prix']));

        return response()->json([
            'status'  => 'success',
            'message' => 'Variante modifiée avec succès',
            'data'    => $variante,
        ], 200);
    }

    public function deletevariante(Request $request)
    {
        $variante = ProduitVariante::findOrFail($request->id);
        $variante->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Variante supprimée',
        ], 200);
    }

    /**
     * Calcule le coût réel d'un ingrédient en sélectionnant la combinaison de paquets
     * la moins chère qui couvre la quantité nécessaire pour la recette.
     *
     * Exemple : besoin de 100 g, variantes [200 g → 2 DT, 1 kg → 7 DT]
     *   → 1 × 200 g = 2 DT  (moins cher que 1 × 1 kg = 7 DT)
     *
     * @param float  $neededQty  Quantité requise par la recette
     * @param string $neededUnit Unité requise (g, kg, ml, l, …)
     * @param \Illuminate\Support\Collection $variantes  Modèles avec ->quantite, ->unite, ->prix
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
}