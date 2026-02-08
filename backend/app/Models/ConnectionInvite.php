<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectionInvite extends Model
{
    use HasFactory;

    protected $fillable = [
        'inviter_user_id',
        'token_hash',
        'expires_at',
        'max_uses',
        'uses_count',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_user_id');
    }
}
