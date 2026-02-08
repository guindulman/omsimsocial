<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CircleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $members = $this->whenLoaded('members');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'icon' => $this->icon,
            'invite_only' => $this->invite_only,
            'prompt_frequency' => $this->prompt_frequency,
            'owner' => UserResource::make($this->whenLoaded('owner')),
            'member_count' => $members ? $members->count() : $this->members()->count(),
            'members' => CircleMemberResource::collection($members),
            'created_at' => $this->created_at,
        ];
    }
}
