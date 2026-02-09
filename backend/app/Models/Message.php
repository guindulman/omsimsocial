<?php

namespace App\Models;

use App\Casts\PrefixedEncryptedString;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'recipient_id',
        'body',
        'media_url',
        'media_type',
        'read_at',
        'deleted_for_sender_at',
        'deleted_for_recipient_at',
    ];

    protected $casts = [
        'body' => PrefixedEncryptedString::class,
        'read_at' => 'datetime',
        'deleted_for_sender_at' => 'datetime',
        'deleted_for_recipient_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}
