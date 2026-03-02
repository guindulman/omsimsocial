<?php

namespace App\Models;

use App\Casts\PrefixedEncryptedString;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'recipient_id',
        'body',
        'body_e2ee_version',
        'body_e2ee_sender_public_key',
        'body_ciphertext_sender',
        'body_nonce_sender',
        'body_ciphertext_recipient',
        'body_nonce_recipient',
        'media_url',
        'media_type',
        'delivered_at',
        'read_at',
        'deleted_for_sender_at',
        'deleted_for_recipient_at',
    ];

    protected $casts = [
        'body' => PrefixedEncryptedString::class,
        'delivered_at' => 'datetime',
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

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }
}
