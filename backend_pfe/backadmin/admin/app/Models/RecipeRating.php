<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecipeRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'recette_id',
        'rate',
    ];

    // 🔗 Relation avec Client
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // 🔗 Relation avec Recette
    public function recette()
    {
        return $this->belongsTo(Recette::class);
    }
}