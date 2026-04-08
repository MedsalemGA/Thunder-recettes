<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\Favorites_RecetteController;

use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\Rating;

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
 Route::get('/recipes/{id}',      [RecipeController::class, 'show']);
    // Authenticated client routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user/profile',      [ProfileController::class, 'getProfile']);
        Route::post('/user/profile',     [ProfileController::class, 'updateProfile']);
        Route::delete('/user/account',   [ProfileController::class, 'deleteAccount']);

        // Recipes & Orders
        
        Route::get('/recipes',           [RecipeController::class, 'index']);
       
        Route::post('/smart-order',      [OrderController::class, 'smartOrder']);
        Route::get('/my-orders',         [OrderController::class, 'myOrders']);

        // User History/Activities
        Route::get('/activities',        [UserActivityController::class, 'index']);
        Route::post('/activities',       [UserActivityController::class, 'store']);
        Route::get('/ingredients/details', [RecipeController::class, 'getIngredientDetails']);
        Route::post('/save-favorite/{id}', [Favorites_RecetteController::class,'store']);
        Route::get('/favorites-recipes', [Favorites_RecetteController::class,'index']);
        Route::delete('/delete-favorite/{id}', [Favorites_RecetteController::class,'destroy']);

        // Panier
        Route::get('/panier',                [CartController::class, 'getCart']);
        Route::post('/panier/items',         [CartController::class, 'addItems']);
        Route::patch('/panier/items/{id}',   [CartController::class, 'updateItem']);
        Route::delete('/panier/items/{id}',  [CartController::class, 'removeItem']);
        Route::delete('/panier',             [CartController::class, 'clearCart']);

        // Préférences culinaires (questionnaire one-shot)
        Route::get('/preferences/check',     [PreferenceController::class, 'check']);
        Route::get('/preferences',           [PreferenceController::class, 'show']);
        Route::post('/preferences',          [PreferenceController::class, 'store']);
        Route::get('/likes', [ProfileController::class, 'getlikes']);

        // Notation des recettes
        Route::post('/recipes/{id}/rate',    [Rating::class, 'store']);
        Route::get('/recipes/{id}/rating',   [Rating::class, 'getUserRating']);
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


