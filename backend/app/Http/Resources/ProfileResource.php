<?php

namespace App\Http\Resources;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'bio' => $this->bio,
            'avatar_url' => MediaUrl::normalize($this->avatar_url, $request),
            'cover_url' => MediaUrl::normalize($this->cover_url, $request),
            'city' => $this->city,
            'website_url' => $this->website_url,
            'birthday' => $this->birthday,
            'gender' => $this->gender,
            'instagram_url' => $this->instagram_url,
            'facebook_url' => $this->facebook_url,
            'tiktok_url' => $this->tiktok_url,
            'privacy_prefs' => $this->privacy_prefs,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
