<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'media_url' => $this->media_url,
            'media_type' => $this->media_type,
            'read_at' => $this->read_at,
            'sender' => UserResource::make($this->whenLoaded('sender')),
            'recipient' => UserResource::make($this->whenLoaded('recipient')),
            'created_at' => $this->created_at,
        ];
    }
}
