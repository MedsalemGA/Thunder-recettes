<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartRecipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'recette_id',
        'ingredients_snapshot',
    ];

    protected $casts = [
        'ingredients_snapshot' => 'array',
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function recette()
    {
        return $this->belongsTo(Recette::class);
    }
}
