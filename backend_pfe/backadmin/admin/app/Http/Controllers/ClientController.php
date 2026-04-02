<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Client;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

 
use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use App\Mail\UserOtpMail;

class ClientController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════
    // REGISTER
    // POST /api/client/auth/register
    // ══════════════════════════════════════════════════════════════════════
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'      => 'required|string|max:255',
                'email'     => 'required|email|unique:users,email',
                'telephone' => 'required|string',
                'adresse'   => 'required|string',
                'password'  => 'required|string|min:6|confirmed',
            ]);

            // 1. Créer le User
            $user = User::create([
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'telephone' => $validated['telephone'],
                'adresse'   => $validated['adresse'],
                'password'  => Hash::make($validated['password']),
                'role'      => 'client',
            ]);

            // 2. Créer l'entrée Client
            Client::create(['user_id' => $user->id]);

            // 3. Générer OTP
            $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->otp_code       = $otp;
            $user->otp_expires_at = Carbon::now()->addMinutes(15);
            $user->save();

            // 4. Envoyer email
            Mail::to($user->email)->send(new UserOtpMail($otp, $user->name));

            // 5. Générer token Sanctum
            $token = $user->createToken('client_auth')->plainTextToken;

            return response()->json([
                'message' => 'Inscription réussie. Veuillez vérifier votre e-mail.',
                'token'   => $token,
                'user'    => $user
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // LOGIN
    // POST /api/client/auth/login
    // ══════════════════════════════════════════════════════════════════════
    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json(['message' => 'Identifiants invalides.'], 401);
            }

            // Vérifier que c'est un client
            if ($user->role !== 'client') {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }

            $token = $user->createToken('client_auth')->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie.',
                'token'   => $token,
                'user'    => $user
            ], 200);

        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // VERIFY EMAIL (OTP)
    // POST /api/client/auth/verify-email
    // ══════════════════════════════════════════════════════════════════════
    public function verifyEmail(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
             // Fallback: essayer de trouver par OTP si non authentifié (optionnel)
             return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $validated = $request->validate(['otp' => 'required|string|size:6']);

        if ($user->otp_code !== $validated['otp']) {
            return response()->json(['message' => 'Code de vérification incorrect.'], 400);
        }

        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            return response()->json(['message' => 'Code expiré.'], 400);
        }

        $user->email_verified_at = Carbon::now();
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'E-mail vérifié avec succès.',
            'user'    => $user
        ], 200);
    }

    // ══════════════════════════════════════════════════════════════════════
    // RESEND OTP
    // POST /api/client/auth/resend-otp
    // ══════════════════════════════════════════════════════════════════════
    public function resendOtp(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Non authentifié.'], 401);

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code       = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(15);
        $user->save();

        Mail::to($user->email)->send(new UserOtpMail($otp, $user->name));

        return response()->json(['message' => 'Un nouveau code a été envoyé.'], 200);
    }

    // ══════════════════════════════════════════════════════════════════════
    // LOGOUT
    // POST /api/client/auth/logout
    // ══════════════════════════════════════════════════════════════════════
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie.'], 200);
    }
   
}