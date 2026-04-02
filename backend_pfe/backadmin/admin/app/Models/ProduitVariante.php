<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProduitVariante extends Model
{
    use HasFactory;

    protected $table = 'produit_variantes';

    protected $fillable = [
        'produit_id',
        'quantite',
        'unite',
        'prix'
    ];

    // 🔗 Relation vers Produit
    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }
}