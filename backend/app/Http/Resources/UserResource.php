<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'email_verified' => ! is_null($this->email_verified_at),
            'email_verified_at' => $this->email_verified_at,
            'phone' => $this->phone,
            'is_private' => $this->is_private,
            'is_active' => $this->is_active,
            'profile' => ProfileResource::make($this->whenLoaded('profile')),
        ];
    }
}
