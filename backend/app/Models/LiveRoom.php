<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'host_user_id',
        'title',
        'visibility',
        'status',
        'provider_stream_id',
        'invite_token_hash',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_user_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(LiveRoomMember::class, 'room_id');
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(LiveChatMessage::class, 'room_id');
    }
}
