<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileSetting extends Model
{
    use HasFactory;

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'profile_visibility',
        'share_profile_views',
        'show_city',
        'show_links',
        'allow_invites_from',
        'allow_calls_from',
    ];

    protected $casts = [
        'share_profile_views' => 'bool',
        'show_city' => 'bool',
        'show_links' => 'bool',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
