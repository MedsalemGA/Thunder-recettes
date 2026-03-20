<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\UserActivity;
use Illuminate\Support\Facades\Auth;

class UserActivityController extends Controller
{
    /**
     * Enregistrer une nouvelle activité
     */
    public function store(Request $request)
    {
        $request->validate([
            'activity_type' => 'required|string',
            'activity_data' => 'nullable|array',
        ]);

        $activity = UserActivity::create([
            'user_id' => Auth::id(),
            'activity_type' => $request->activity_type,
            'activity_data' => $request->activity_data,
        ]);

        return response()->json([
            'message' => 'Activité enregistrée avec succès',
            'activity' => $activity
        ], 201);
    }

    /**
     * Récupérer l'historique de l'utilisateur
     */
    public function index()
    {
        $activities = UserActivity::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($activities);
    }
}
