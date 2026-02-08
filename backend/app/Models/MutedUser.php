<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MutedUser extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'muted_user_id',
    ];
}
