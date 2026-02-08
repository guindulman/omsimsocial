<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HiddenMemory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'memory_id',
    ];
}
