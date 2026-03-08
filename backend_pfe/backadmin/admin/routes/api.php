<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

Route::post('/adminlogin',[AdminController::class,'login']);
Route::post('/verify-otp',[AdminController::class,'verifyOtp']);
Route::post('/getadmininfo',[AdminController::class,'getadmininfo']);
Route::middleware('auth:sanctum')->post('/logout', [AdminController::class, 'logout']);
Route::post('/ajouterfournisseur',[AdminController::class,'ajouterfournisseur']);
Route::get('/getallforunisseur',[AdminController::class,'getallfournisseurs']);
Route::get('/chercherfournisseur',[AdminController::class,'chercherfournisseur']);
Route::delete('/deletefournisseur',[AdminController::class,'deletefournisseurs']);
Route::patch('/updatefournisseur',[AdminController::class,'updatefournisseurs']);
Route::get('/getallrecettes',[AdminController::class,'getallrecettes']);
Route::post('/ajouterrecettes',[AdminController::class,'ajouterrecettes']);
Route::patch('/updaterecettes',[AdminController::class,'updaterecettes']);
Route::delete('/deleterecettes',[AdminController::class,'deleterecettes']);
