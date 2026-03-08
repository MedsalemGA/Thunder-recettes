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
    $fournisseurs = Fournisseur::with('user')
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
    $recettes = Recette::all();
    return response()->json([
        "status"  => "success",
        "message" => "Recettes found",
        "data"    => $recettes,
    ], 200);
}
public function ajouterrecettes(Request $request){
    $validated = $request->validate([
        "nom" => "required",
        "description" => "required",
        "image"=> "required",
        "temps_preparation" => "required",
        "nombre_personnes" => "required",
        "categorie" => "required",
        "prix" => "required",
    ]);
    $recette = Recette::create($validated);
    return response()->json([
        "status"  => "success",
        "message" => "Recette created successfully",
        "data"    => $recette
    ], 201);
}
public function updaterecettes(Request $request)
{
    $recette = Recette::findOrFail($request->id);

    $recette->update($request->except('id'));

    return response()->json([
        "status"  => "success",
        "message" => "Recette updated",
        "data"    => $recette
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

}