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
        'difficulte',
        'rating',
        'prix',
        'instructions',
    ];

    protected $casts = [
        'instructions'     => 'array',
        'rating'           => 'decimal:2',
        'prix'             => 'decimal:2',
        'temps_preparation'=> 'integer',
        'temps_cuisson'    => 'integer',
        'nombre_personnes' => 'integer',
    ];

    // -------------------------------------------------------
    // Relations
    // -------------------------------------------------------

    // Tous les ingrédients (avec ou sans produit lié)
    public function ingredients()
    {
        return $this->hasMany(RecetteIngredient::class);
    }

    // Uniquement les ingrédients liés à un produit du marché
    public function produits()
    {
        return $this->belongsToMany(Produit::class, 'recette_ingredients')
                    ->withPivot(['nom_ingredient', 'quantite', 'unite', 'calories_100g'])
                    ->withTimestamps();
    }

    // -------------------------------------------------------
    // Accessors
    // -------------------------------------------------------

    // Calories totales calculées dynamiquement.
    // Utilise calories_100g de recette_ingredients en priorité,
    // sinon lit depuis produits.calories_100g via la relation.
    public function getCaloriesTotalesAttribute(): float
    {
        return round(
            $this->ingredients->map(function ($ing) {
                $cal100g = (float)$ing->calories_100g;
                if ($cal100g === 0.0 && $ing->produit !== null) {
                    $cal100g = (float)$ing->produit->calories_100g;
                }
                return $cal100g * (float)$ing->quantite / 100;
            })->sum(),
            1
        );
    }

    // Prix total basé sur les ingrédients en stock uniquement
    public function getPrixIngredientsAttribute(): float
    {
        return round(
            $this->ingredients
                ->filter(fn($ing) => $ing->produit !== null)
                ->map(fn($ing) => $ing->produit->prix * $ing->quantite / 1000)
                ->sum(),
            2
        );
    }
}