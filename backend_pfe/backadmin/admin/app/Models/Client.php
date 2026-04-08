<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'user_id',
        
    ];    
public function user()
{
    return $this->belongsTo(User::class);
}
public function favorites()
{
    return $this->hasMany(Favorite_Recette::class, 'id_client');
}
public function likes()
{
    return $this->hasMany(Like::class);
}
public function ratings()
{
    return $this->hasMany(RecipeRating::class);
}
}
