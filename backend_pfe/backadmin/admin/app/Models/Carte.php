<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carte extends Model
{
    protected $table = 'cartes';

    protected $fillable = [
        'client_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // ── Relations ────────────────────────────────────────

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(CarteItem::class);
    }

    // ── Helpers ──────────────────────────────────────────

    /** Recalcule et sauvegarde le montant total */
    public function recalculerMontant(): void
    {
        $total = 0;
        foreach ($this->items as $item) {
            $total += (float)$item->prix_unitaire * (float)$item->quantite;
        }
        $this->amount = round($total, 2);
        $this->save();
    }
}
