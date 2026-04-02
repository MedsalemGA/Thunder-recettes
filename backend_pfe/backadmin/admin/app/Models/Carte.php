<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carte extends Model
{
    //
    protected $fillable = [
        'client_id',
        'amount',
    ];
    public function client()
{
    return $this->belongsTo(Client::class);
}
}
