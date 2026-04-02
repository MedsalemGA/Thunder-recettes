<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Fournisseur extends Model
{
    
    protected $fillable = [
        'user_id',
        'specialite',
        'code_commercial',
        
    ];  
public function user()
{
    return $this->belongsTo(User::class);
}
public function produits(){
    return $this->hasMany(Produit::class);
}
}
