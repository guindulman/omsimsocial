<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeCapsuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'scope' => $this->scope,
            'unlock_at' => $this->unlock_at,
            'circle_id' => $this->circle_id,
            'direct_user_id' => $this->direct_user_id,
            'items' => $this->whenLoaded('items', fn () => $this->items->pluck('memory_id')->values()),
            'created_at' => $this->created_at,
        ];
    }
}
