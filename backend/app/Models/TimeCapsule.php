<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimeCapsule extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'unlock_at',
        'scope',
        'circle_id',
        'direct_user_id',
        'title',
    ];

    protected $casts = [
        'unlock_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TimeCapsuleItem::class);
    }
}
