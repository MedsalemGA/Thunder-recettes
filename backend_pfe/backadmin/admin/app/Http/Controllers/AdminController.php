<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;

class AdminController extends Controller
{
    public function login(Request $request)
{
    try {
        $validated = $request->validate([
            "usernameOrEmail" => "required|email",
            "password" => "required"
        ]);

        $admin = Admin::where("email", $validated["usernameOrEmail"])->first();

        if (!$admin) {
            return response()->json([
                "status" => "error",
                "message" => "Aucun compte trouvé avec cet email"
            ], 401);  // ou 422
        }

        if (!password_verify($validated["password"], $admin->password)) {
            return response()->json([
                "status" => "error",
                "message" => "Mot de passe incorrect"
            ], 401);
        }

        // Tout est OK
        $token = $admin->createToken("auth_token")->plainTextToken;

        return response()->json([
            "status" => "success",
            "message" => "Login successful",
            "data" => [
                "admin" => $admin,
                "token" => $token
            ]
        ], 200);

    } catch (\Exception $e) {
        // Capture TOUTES les erreurs et renvoie JSON
        \Log::error('Login error: ' . $e->getMessage());

        return response()->json([
            "status" => "error",
            "message" => "Erreur serveur : " . $e->getMessage()
        ], 500);
    }
}}