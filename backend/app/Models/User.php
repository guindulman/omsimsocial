<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * App-level defaults that mirror DB defaults.
     * This avoids "null" flags on freshly-created models before a refresh.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
        'is_private' => false,
        'is_moderator' => false,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'bool',
            'is_private' => 'bool',
            'is_moderator' => 'bool',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function connectionsRequested(): HasMany
    {
        return $this->hasMany(Connection::class, 'requester_id');
    }

    public function connectionsReceived(): HasMany
    {
        return $this->hasMany(Connection::class, 'addressee_id');
    }

    public function circlesOwned(): HasMany
    {
        return $this->hasMany(Circle::class, 'owner_id');
    }

    public function circleMemberships(): HasMany
    {
        return $this->hasMany(CircleMember::class);
    }

    public function memories(): HasMany
    {
        return $this->hasMany(Memory::class, 'author_id');
    }

    public function vaultItems(): HasMany
    {
        return $this->hasMany(VaultItem::class);
    }

    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }

    public function messagesSent(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived(): HasMany
    {
        return $this->hasMany(Message::class, 'recipient_id');
    }

    public function inboxEvents(): HasMany
    {
        return $this->hasMany(InboxEvent::class);
    }

    public function moderationNotes(): HasMany
    {
        return $this->hasMany(UserModerationNote::class);
    }
}
