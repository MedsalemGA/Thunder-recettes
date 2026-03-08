<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recette extends Model
{
    protected $fillable = [
    'nom',
    'description',
    'image',
    'temps_preparation',
    'temps_cuisson',
    'nombre_personnes',
    'categorie',
    'prix',
];
}
