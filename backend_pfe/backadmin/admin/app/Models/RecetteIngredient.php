<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetteIngredient extends Model
{
    protected $table = 'recette_ingredients';

    protected $fillable = [
        'recette_id',
        'produit_id',       // nullable
        'nom_ingredient',   // toujours présent
        'quantite',
        'unite',
        'calories_100g',    // stocké directement dans le pivot
    ];

    protected $casts = [
        'quantite'     => 'decimal:2',
        'calories_100g'=> 'decimal:2',
        'produit_id'   => 'integer',
    ];

    // Calories calculées pour cet ingrédient selon la quantité.
    // Utilise directement calories_100g stocké dans recette_ingredients.
    public function getCaloriesIngredientAttribute(): float
    {
        $cal100g = (float)($this->calories_100g ?? 0);
        return round($cal100g * (float)$this->quantite / 100, 1);
    }

    // Est-ce que cet ingrédient est lié à un produit du marché ?
    public function isEnStock(): bool
    {
        return $this->produit_id !== null;
    }

    // Relations
    public function recette()
    {
        return $this->belongsTo(Recette::class);
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class); // peut être null
    }
}