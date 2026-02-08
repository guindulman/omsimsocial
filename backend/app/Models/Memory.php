<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Memory extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'author_id',
        'scope',
        'circle_id',
        'direct_user_id',
        'body',
        'location',
        'client_post_id',
        'comments_count_cached',
        'hearts_count_cached',
        'saves_count_cached',
        'reshares_count_cached',
        'story_audience',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function circle(): BelongsTo
    {
        return $this->belongsTo(Circle::class);
    }

    public function directUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'direct_user_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(MemoryMedia::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(MemoryTag::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(Reaction::class);
    }

    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(MemoryComment::class);
    }

    public function storyViews(): HasMany
    {
        return $this->hasMany(StoryView::class);
    }

    public function reshares(): HasMany
    {
        return $this->hasMany(MemoryReshare::class);
    }
}
