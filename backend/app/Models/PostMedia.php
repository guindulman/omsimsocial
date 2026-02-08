<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'type',
        'url',
        'thumb_url',
        'duration_ms',
        'order_index',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
