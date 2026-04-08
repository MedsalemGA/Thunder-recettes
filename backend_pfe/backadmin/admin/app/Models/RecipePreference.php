<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipePreference extends Model
{
    protected $table = 'recipe_preferences';

    protected $fillable = [
        'user_id',
        'cuisine_preference',
        'objectif_alimentaire',
        'niveau_activite',
        'restrictions_alimentaires',
        'niveau_difficulte',
        'budget',
        'temps_cuisine',
        'type_plat',
        'nb_personnes',
        'allergies',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

