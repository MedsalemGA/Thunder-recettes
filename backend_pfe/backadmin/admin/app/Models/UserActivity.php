<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'activity_type',
        'activity_data',
    ];

    protected $casts = [
        'activity_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
