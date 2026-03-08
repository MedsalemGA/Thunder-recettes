<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use Notifiable;
    use HasApiTokens;

    protected $table = 'admins';

    protected $fillable = [
        'user_id',
        'login_otp',
        'login_otp_expires_at',
    ];

    protected $casts = [
        'login_otp_expires_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
