<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeCapsuleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'time_capsule_id',
        'memory_id',
    ];

    public function timeCapsule(): BelongsTo
    {
        return $this->belongsTo(TimeCapsule::class);
    }

    public function memory(): BelongsTo
    {
        return $this->belongsTo(Memory::class);
    }
}
