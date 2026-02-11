<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataDeletionRequest extends Model
{
    protected $fillable = [
        'app_name',
        'full_name',
        'email',
        'username',
        'request_types',
        'details',
        'status',
        'user_agent',
        'ip_address',
        'verified_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'request_types' => 'array',
            'verified_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}

