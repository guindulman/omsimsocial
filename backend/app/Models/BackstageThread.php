<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BackstageThread extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'created_by_user_id',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(BackstageThreadParticipant::class, 'thread_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(BackstageMessage::class, 'thread_id');
    }
}
