<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'caption' => $this->caption,
            'status' => $this->status,
            'visibility_scope' => $this->visibility_scope,
            'vip_until' => $this->vip_until,
            'expires_at' => $this->expires_at,
            'adopted_count' => $this->adopted_count,
            'clarify_count' => $this->clarify_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'media' => PostMediaResource::collection($this->whenLoaded('media')),
        ];
    }
}
