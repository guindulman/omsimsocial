<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'requester' => UserResource::make($this->whenLoaded('requester')),
            'target' => UserResource::make($this->whenLoaded('target')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
