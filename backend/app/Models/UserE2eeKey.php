<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserE2eeKey extends Model
{
    use HasFactory;

    protected $table = 'user_e2ee_keys';

    protected $fillable = [
        'user_id',
        'public_key',
        'algorithm',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

