<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoryMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'memory_id',
        'type',
        'url',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function memory(): BelongsTo
    {
        return $this->belongsTo(Memory::class);
    }
}
