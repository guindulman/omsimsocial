<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'profile_visibility' => $this->profile_visibility,
            'share_profile_views' => (bool) $this->share_profile_views,
            'show_city' => (bool) $this->show_city,
            'show_links' => (bool) $this->show_links,
            'allow_invites_from' => $this->allow_invites_from,
            'allow_calls_from' => $this->allow_calls_from,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
