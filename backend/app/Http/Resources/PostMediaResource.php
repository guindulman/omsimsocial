<?php

namespace App\Http\Resources;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostMediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'url' => MediaUrl::normalize($this->url, $request),
            'thumb_url' => MediaUrl::normalize($this->thumb_url, $request),
            'duration_ms' => $this->duration_ms,
            'order_index' => $this->order_index,
        ];
    }
}
