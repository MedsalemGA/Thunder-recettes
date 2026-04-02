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
    ];

    protected $casts = [
        'quantite'     => 'decimal:2',
        'produit_id'   => 'integer',
    ];

    // Calories calculées pour cet ingrédient selon la quantité.
    // calories_100g absent de recette_ingredients → toujours lue depuis produits
    public function getCaloriesIngredientAttribute(): float
    {
        $cal100g = (float)($this->produit?->calories_100g ?? 0);
        return round($cal100g * (float)$this->quantite / 100, 1);
    }

    // calories_100g résolu depuis le produit lié
    public function getCalories100gResolvedAttribute(): float
    {
        return (float)($this->produit?->calories_100g ?? 0);
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