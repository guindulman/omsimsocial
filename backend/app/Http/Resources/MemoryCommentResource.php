<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemoryCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'created_at' => $this->created_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'likes_count' => $this->likes_count ?? $this->likes()->count(),
            'is_liked' => isset($this->is_liked)
                ? (bool) $this->is_liked
                : (auth()->check()
                    ? $this->likes()->where('user_id', auth()->id())->exists()
                    : false),
        ];
    }
}
