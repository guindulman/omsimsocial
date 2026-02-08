<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Connection extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'addressee_id',
        'user_low_id',
        'user_high_id',
        'status',
        'method',
        'type',
        'level',
        'invite_code',
        'muted_at',
        'verified_at',
    ];

    protected $casts = [
        'muted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function addressee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'addressee_id');
    }
}
