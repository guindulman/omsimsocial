<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiveRoomResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'host_user_id' => $this->host_user_id,
            'title' => $this->title,
            'visibility' => $this->visibility,
            'status' => $this->status,
            'provider_stream_id' => $this->provider_stream_id,
            'started_at' => $this->started_at,
            'ended_at' => $this->ended_at,
            'created_at' => $this->created_at,
            'host' => UserResource::make($this->whenLoaded('host')),
        ];
    }
}
