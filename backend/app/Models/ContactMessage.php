<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $table = 'contact_messages';

    protected $fillable = [
        'name',
        'email',
        'message',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    public const UPDATED_AT = null;

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];
}

