<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConnectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'method' => $this->method,
            'type' => $this->type,
            'level' => $this->level,
            'invite_code' => $this->invite_code,
            'muted_at' => $this->muted_at,
            'requester' => UserResource::make($this->whenLoaded('requester')),
            'addressee' => UserResource::make($this->whenLoaded('addressee')),
            'created_at' => $this->created_at,
        ];
    }
}
