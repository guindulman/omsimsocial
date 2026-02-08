<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdoptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'note' => $this->note,
            'visibility' => $this->visibility,
            'user' => UserResource::make($this->whenLoaded('user')),
            'memory_id' => $this->memory_id,
            'created_at' => $this->created_at,
        ];
    }
}
