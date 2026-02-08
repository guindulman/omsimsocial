<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Circle extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'icon',
        'invite_only',
        'prompt_frequency',
    ];

    protected $casts = [
        'invite_only' => 'bool',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(CircleMember::class);
    }

    public function memories(): HasMany
    {
        return $this->hasMany(Memory::class);
    }

    public function prompts(): HasMany
    {
        return $this->hasMany(CirclePrompt::class);
    }
}
