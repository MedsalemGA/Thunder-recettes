<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\Api\UserActivityController;

use App\Http\Controllers\Api\SearchController;

Route::post('/adminlogin',[AdminController::class,'login']);
Route::post('/verify-otp',[AdminController::class,'verifyOtp']);
Route::post('/getadmininfo',[AdminController::class,'getadmininfo']);
Route::middleware('auth:sanctum')->post('/logout', [AdminController::class, 'logout']);

// ── CLIENT ROUTES ────────────────────────────────────────────────────────────
Route::group(['prefix' => 'client'], function () {
    Route::post('/auth/register',   [ClientController::class, 'register']);
    Route::post('/auth/login',      [ClientController::class, 'login']);
    Route::post('/auth/verify-email', [ClientController::class, 'verifyEmail']);
    Route::post('/auth/resend-otp', [ClientController::class, 'resendOtp']);
    Route::post('/auth/logout',     [ClientController::class, 'logout'])->middleware('auth:sanctum');
    
    // Global search
    Route::get('/search',           [SearchController::class, 'search']);

    // Authenticated client routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user/profile',      [ProfileController::class, 'getProfile']);
        Route::post('/user/profile',     [ProfileController::class, 'updateProfile']);
        Route::delete('/user/account',   [ProfileController::class, 'deleteAccount']);

        // Recipes & Orders
        Route::get('/ingredients/details', [RecipeController::class, 'getIngredientDetails']);
        Route::get('/recipes',           [RecipeController::class, 'index']);
        Route::get('/recipes/{id}',      [RecipeController::class, 'show']);
        Route::post('/smart-order',      [OrderController::class, 'smartOrder']);
        Route::get('/my-orders',         [OrderController::class, 'myOrders']);

        // User History/Activities
        Route::get('/activities',        [UserActivityController::class, 'index']);
        Route::post('/activities',       [UserActivityController::class, 'store']);
    });
});
Route::post('/ajouterfournisseur',[AdminController::class,'ajouterfournisseur']);
Route::get('/getallforunisseur',[AdminController::class,'getallfournisseurs']);
Route::get('/chercherfournisseur',[AdminController::class,'chercherfournisseur']);
Route::delete('/deletefournisseur',[AdminController::class,'deletefournisseurs']);
Route::patch('/updatefournisseur',[AdminController::class,'updatefournisseurs']);
Route::get('/getallrecettes',[AdminController::class,'getallrecettes']);
Route::post('/ajouterrecettes',[AdminController::class,'ajouterrecettes']);
Route::patch('/updaterecettes',[AdminController::class,'updaterecettes']);
Route::delete('/deleterecettes',[AdminController::class,'deleterecettes']);
