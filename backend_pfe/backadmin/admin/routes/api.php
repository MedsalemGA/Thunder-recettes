<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

Route::post('/adminlogin',[AdminController::class,'login']);
Route::post('/getadmininfo',[AdminController::class,'getadmininfo']);
Route::middleware('auth:sanctum')->post('/logout', [AdminController::class, 'logout']);
Route::post('/ajouterfournisseur',[AdminController::class,'ajouterfournisseur']);
Route::get('/getallforunisseur',[AdminController::class,'getallfournisseurs']);
Route::get('/chercherfournisseur',[AdminController::class,'chercherfournisseur']);
Route::get('/deletefournisseur',[AdminController::class,'deletefournisseurs']);
Route::patch('/updatefournisseur',[AdminController::class,'updatefournisseurs']);
