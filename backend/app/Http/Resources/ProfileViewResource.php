<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileViewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'viewed_user_id' => $this->viewed_user_id,
            'viewer_user_id' => $this->viewer_user_id,
            'viewer_visibility' => $this->viewer_visibility,
            'source' => $this->source,
            'created_at' => $this->created_at,
            'viewer' => $this->viewer_visibility === 'named'
                ? UserResource::make($this->whenLoaded('viewerUser'))
                : null,
        ];
    }
}
