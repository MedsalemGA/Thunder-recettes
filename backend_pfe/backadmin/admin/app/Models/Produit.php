<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produit extends Model
{
    protected $fillable = [
        'nom',
        'calories_100g',
        'description',
        'prix',
        'quantite_stock',
        'fournisseur_id',
        'image',
    ];

    protected $casts = [
        'calories_100g'  => 'decimal:2',
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
}