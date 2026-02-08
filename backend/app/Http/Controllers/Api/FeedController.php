<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Connection;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function fresh()
    {
        $posts = Post::query()
            ->where('status', '!=', 'expired')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            })
            ->latest()
            ->with(['user', 'media'])
            ->limit(30)
            ->get();

        return response()->json([
            'posts' => PostResource::collection($posts),
        ]);
    }

    public function lastCall()
    {
        $now = Carbon::now();
        $soon = Carbon::now()->addHours(2);

        $posts = Post::query()
            ->where('status', '!=', 'expired')
            ->whereBetween('expires_at', [$now, $soon])
            ->orderBy('expires_at')
            ->with(['user', 'media'])
            ->limit(30)
            ->get();

        return response()->json([
            'posts' => PostResource::collection($posts),
        ]);
    }

    public function gems()
    {
        $posts = Post::query()
            ->where('status', 'gem')
            ->latest()
            ->with(['user', 'media'])
            ->limit(30)
            ->get();

        return response()->json([
            'posts' => PostResource::collection($posts),
        ]);
    }

    public function connections(Request $request)
    {
        $userId = $request->user()->id;

        $connectionIds = Connection::query()
            ->where('user_a_id', $userId)
            ->orWhere('user_b_id', $userId)
            ->get()
            ->map(function (Connection $connection) use ($userId) {
                return $connection->user_a_id === $userId
                    ? $connection->user_b_id
                    : $connection->user_a_id;
            })
            ->filter()
            ->values();

        $posts = Post::query()
            ->whereIn('user_id', $connectionIds)
            ->where('status', '!=', 'expired')
            ->latest()
            ->with(['user', 'media'])
            ->limit(30)
            ->get();

        return response()->json([
            'posts' => PostResource::collection($posts),
        ]);
    }
}
