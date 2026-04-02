<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = ['client_id', 'amount'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function cartRecipes()
    {
        return $this->hasMany(CartRecipe::class);
    }
}
