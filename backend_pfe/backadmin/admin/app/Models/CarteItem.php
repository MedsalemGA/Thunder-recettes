<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarteItem extends Model
{
    protected $table = 'carte_items';

    protected $fillable = [
        'carte_id',
        'produit_id',
        'recette_id',
        'nom_ingredient',
        'quantite',
        'unite',
        'prix_unitaire',
    ];

    protected $casts = [
        'quantite'      => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'produit_id'    => 'integer',
        'recette_id'    => 'integer',
        'carte_id'      => 'integer',
    ];

    // ── Relations ────────────────────────────────────────

    public function carte()
    {
        return $this->belongsTo(Carte::class);
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function recette()
    {
        return $this->belongsTo(Recette::class);
    }

    // ── Accessors ────────────────────────────────────────

    /** Prix total pour cet item (prix_unitaire × quantite) */
    public function getPrixTotalAttribute(): float
    {
        return round((float)$this->prix_unitaire * (float)$this->quantite, 2);
    }
}

