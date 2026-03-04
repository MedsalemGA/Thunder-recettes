<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

Route::post('/adminlogin',[AdminController::class,'login']);
Route::post('/getadmininfo',[AdminController::class,'getadmininfo']);
Route::middleware('auth:sanctum')->post('/logout', [AdminController::class, 'logout']);
Route::post('/ajouterfournisseur',[AdminController::class,'ajouterfournisseur']);
Route::get('/chercherfournisseur',[AdminController::class,'chercherfournisseur']);
