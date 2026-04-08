<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    protected $fillable = [
        'nom',
        'description',
        'prix',
        'quantite_stock',
        'fournisseur_id',
        'image',
    ];

    protected $casts = [
        'prix'           => 'decimal:2',
        'quantite_stock' => 'integer',
        'fournisseur_id' => 'integer',
    ];

    // -------------------------------------------------------
    // Relations
    // -------------------------------------------------------

    // Toutes les recettes qui utilisent ce produit
    public function recettes()
    {
        return $this->belongsToMany(Recette::class, 'recette_ingredients')
                    ->withPivot(['nom_ingredient', 'quantite', 'unite', 'calories_100g'])
                    ->withTimestamps();
    }

    // calories_100g supprimé de ce modèle — stocké dans recette_ingredients

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    // -------------------------------------------------------
    // Accessors
    // -------------------------------------------------------

    // Est-ce que le produit est disponible en stock ?
    public function getEnStockAttribute(): bool
    {
        return $this->quantite_stock > 0;
    }
    public function variantes()
{
    return $this->hasMany(ProduitVariante::class);
}
public function likes()
{
    return $this->hasMany(Like::class);
}
}