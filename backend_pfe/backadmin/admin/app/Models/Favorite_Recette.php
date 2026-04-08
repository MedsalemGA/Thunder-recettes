<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite_Recette extends Model
{
    protected $fillable = [
        'id_recette',
        'id_client'
    ];

    public function recette()
    {
        return $this->belongsTo(Recette::class, 'id_recette');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'id_client');
    }
}
