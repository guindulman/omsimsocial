<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdoptRequest;
use App\Http\Requests\CreatePostRequest;
use App\Http\Resources\AdoptionResource;
use App\Http\Resources\PostResource;
use App\Models\Adoption;
use App\Models\Post;
use App\Models\PostMedia;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(CreatePostRequest $request)
    {
        $user = $request->user();

        $post = Post::query()->create([
            'user_id' => $user->id,
            'caption' => $request->input('caption'),
            'status' => $request->input('status', 'vip'),
            'visibility_scope' => $request->input('visibility_scope', 'public'),
            'vip_until' => Carbon::now()->addHours(2),
            'expires_at' => Carbon::now()->addHours(24),
            'adopted_count' => 0,
            'clarify_count' => 0,
        ]);

        $media = $request->input('media', []);
        foreach ($media as $item) {
            PostMedia::query()->create([
                'post_id' => $post->id,
                'type' => $item['type'],
                'url' => $item['url'],
                'thumb_url' => $item['thumb_url'] ?? null,
                'duration_ms' => $item['duration_ms'] ?? null,
                'order_index' => $item['order_index'] ?? 0,
            ]);
        }

        return response()->json([
            'post' => PostResource::make($post->load(['user', 'media'])),
        ], 201);
    }

    public function show(Request $request, Post $post)
    {
        $this->authorize('view', $post);

        return response()->json([
            'post' => PostResource::make($post->load(['user', 'media'])),
        ]);
    }

    public function destroy(Request $request, Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }

    public function adopt(AdoptRequest $request, Post $post)
    {
        $this->authorize('view', $post);

        $adoption = Adoption::query()->create([
            'original_post_id' => $post->id,
            'adopter_user_id' => $request->user()->id,
            'adoption_type' => $request->input('adoption_type'),
            'contribution_text' => $request->input('contribution_text'),
            'parent_adoption_id' => $request->input('parent_adoption_id'),
        ]);

        $post->increment('adopted_count');

        return response()->json([
            'adoption' => AdoptionResource::make($adoption),
        ], 201);
    }

    public function chain(Post $post)
    {
        $adoptions = Adoption::query()
            ->where('original_post_id', $post->id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'adoptions' => AdoptionResource::collection($adoptions),
        ]);
    }
}
