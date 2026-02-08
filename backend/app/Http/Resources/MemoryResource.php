<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reactions = $this->whenLoaded('reactions', function () {
            $grouped = $this->reactions
                ->groupBy('emoji')
                ->map(fn ($group, $emoji) => [
                    'emoji' => $emoji,
                    'count' => $group->count(),
                ])
                ->values();

            $cachedHearts = $this->hearts_count_cached;
            if ($cachedHearts !== null) {
                $hasHeart = false;
                $grouped = $grouped->map(function ($item) use ($cachedHearts, &$hasHeart) {
                    if ($item['emoji'] === 'heart') {
                        $hasHeart = true;
                        return [
                            'emoji' => 'heart',
                            'count' => $cachedHearts,
                        ];
                    }
                    return $item;
                })->values();

                if (! $hasHeart && $cachedHearts > 0) {
                    $grouped->push([
                        'emoji' => 'heart',
                        'count' => $cachedHearts,
                    ]);
                }
            }

            return $grouped;
        });

        return [
            'id' => $this->id,
            'author' => UserResource::make($this->whenLoaded('author')),
            'scope' => $this->scope,
            'circle_id' => $this->circle_id,
            'direct_user_id' => $this->direct_user_id,
            'body' => $this->body,
            'location' => $this->location,
            'client_post_id' => $this->client_post_id,
            'story_audience' => $this->story_audience,
            'expires_at' => $this->expires_at,
            'deleted_at' => $this->deleted_at,
            'media' => MemoryMediaResource::collection($this->whenLoaded('media')),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('user_id')->values()),
            'tagged_users' => $this->whenLoaded('tags', function () {
                $users = $this->tags->pluck('user')->filter()->values();
                return UserResource::collection($users);
            }),
            'reactions' => $reactions,
            'adoptions_count' => $this->saves_count_cached ?? $this->adoptions()->count(),
            'comments_count' => $this->comments_count_cached ?? $this->comments()->count(),
            'reshares_count' => $this->reshares_count_cached ?? $this->reshares()->count(),
            'is_liked' => auth()->check()
                ? ($this->relationLoaded('reactions')
                    ? $this->reactions
                        ->where('user_id', auth()->id())
                        ->where('emoji', 'heart')
                        ->isNotEmpty()
                    : $this->reactions()
                        ->where('user_id', auth()->id())
                        ->where('emoji', 'heart')
                        ->exists())
                : false,
            'is_reshared' => auth()->check()
                ? $this->reshares()->where('user_id', auth()->id())->exists()
                : false,
            'is_saved' => auth()->check()
                ? $this->adoptions()->where('user_id', auth()->id())->exists()
                : false,
            'story_views_count' => $this->scope === 'story'
                ? ($this->story_views_count ?? $this->storyViews()->count())
                : null,
            'created_at' => $this->created_at,
        ];
    }
}
