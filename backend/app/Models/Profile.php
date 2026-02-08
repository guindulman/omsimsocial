<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory;

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'avatar_url',
        'cover_url',
        'bio',
        'city',
        'website_url',
        'birthday',
        'gender',
        'instagram_url',
        'facebook_url',
        'tiktok_url',
        'privacy_prefs',
    ];

    protected $casts = [
        'privacy_prefs' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
