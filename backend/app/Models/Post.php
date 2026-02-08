<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'caption',
        'status',
        'visibility_scope',
        'vip_until',
        'expires_at',
        'adopted_count',
        'clarify_count',
    ];

    protected $casts = [
        'vip_until' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class);
    }

    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class, 'original_post_id');
    }

    public function backstageThread(): HasOne
    {
        return $this->hasOne(BackstageThread::class);
    }
}
