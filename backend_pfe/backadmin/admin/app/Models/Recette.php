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
        
        'instructions',
    ];

    protected $casts = [
        'instructions'     => 'array',
        
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

    // Calories totales calculées dynamiquement depuis recette_ingredients.calories_100g.
    public function getCaloriesTotalesAttribute(): float
    {
        return round(
            $this->ingredients->sum(function ($ing) {
                return (float)($ing->calories_100g ?? 0) * (float)$ing->quantite / 100;
            }),
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
    public function favorites()
{
    return $this->hasMany(Favorite_Recette::class, 'id_recette');
}
public function ratings()
{
    return $this->hasMany(RecipeRating::class);
}
}