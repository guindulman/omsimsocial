<?php

namespace App\Models;

use App\Casts\PrefixedEncryptedString;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BackstageMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'thread_id',
        'user_id',
        'message',
        'media_url',
    ];

    protected $casts = [
        'message' => PrefixedEncryptedString::class,
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(BackstageThread::class, 'thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
