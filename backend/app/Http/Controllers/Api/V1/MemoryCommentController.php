<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemoryCommentResource;
use App\Models\Memory;
use App\Models\MemoryComment;
use App\Models\MemoryCommentLike;
use App\Http\Resources\UserResource;
use App\Models\InboxEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemoryCommentController extends Controller
{
    public function index(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $limit = (int) $request->query('limit', 30);
        $limit = max(1, min(50, $limit));
        $cursor = $request->query('cursor');

        $query = MemoryComment::query()
            ->where('memory_id', $memory->id)
            ->with('user.profile')
            ->orderByDesc('id')
            ->withCount('likes');

        if ($request->user()) {
            $query->withCount([
                'likes as is_liked' => function ($builder) use ($request) {
                    $builder->where('user_id', $request->user()->id);
                },
            ]);
        }

        $paginator = $query->cursorPaginate($limit, ['*'], 'cursor', $cursor);
        $nextCursor = $paginator->nextCursor();

        return MemoryCommentResource::collection($paginator->items())->additional([
            'next_cursor' => $nextCursor ? $nextCursor->encode() : null,
            'has_more' => $paginator->hasMorePages(),
        ]);
    }

    public function store(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $payload = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:memory_comments,id'],
        ]);

        if (! empty($payload['parent_id'])) {
            $parent = MemoryComment::query()->find($payload['parent_id']);
            if (! $parent || $parent->memory_id !== $memory->id) {
                return $this->errorResponse('comment_parent_invalid', 'Invalid parent comment.', 422);
            }
        }

        $comment = MemoryComment::query()->create([
            'memory_id' => $memory->id,
            'user_id' => $request->user()->id,
            'parent_id' => $payload['parent_id'] ?? null,
            'body' => $payload['body'],
        ]);

        $memory->newQuery()
            ->where('id', $memory->id)
            ->update([
                'comments_count_cached' => DB::raw('comments_count_cached + 1'),
            ]);

        $actor = $request->user();
        $snippet = $this->snippet($comment->body);
        $parentId = $comment->parent_id;
        $parentUserId = isset($parent) ? $parent->user_id : null;

        if ($memory->author_id !== $actor->id) {
            InboxEvent::query()->create([
                'user_id' => $memory->author_id,
                'type' => 'memory_commented',
                'data' => [
                    'memory_id' => $memory->id,
                    'comment_id' => $comment->id,
                    'parent_comment_id' => $parentId,
                    'comment_body' => $comment->body,
                    'snippet' => $snippet,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'actor_username' => $actor->username,
                    'actor_avatar_url' => $actor->profile?->avatar_url,
                ],
            ]);
        }

        if ($parentUserId && $parentUserId !== $actor->id && $parentUserId !== $memory->author_id) {
            InboxEvent::query()->create([
                'user_id' => $parentUserId,
                'type' => 'comment_replied',
                'data' => [
                    'memory_id' => $memory->id,
                    'comment_id' => $comment->id,
                    'parent_comment_id' => $parentId,
                    'comment_body' => $comment->body,
                    'snippet' => $snippet,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'actor_username' => $actor->username,
                    'actor_avatar_url' => $actor->profile?->avatar_url,
                ],
            ]);
        }

        $comment->load('user.profile')->loadCount('likes');
        $comment->setAttribute('is_liked', 0);
        $resource = MemoryCommentResource::make($comment);

        return response()->json([
            'comment' => $resource,
            'data' => $resource,
        ], 201);
    }

    public function destroy(Request $request, MemoryComment $comment)
    {
        if ($comment->user_id !== $request->user()->id) {
            return $this->errorResponse('comment_forbidden', 'Only the author can delete this comment.', 403);
        }

        $memoryId = $comment->memory_id;
        $comment->delete();

        Memory::query()
            ->where('id', $memoryId)
            ->update([
                'comments_count_cached' => DB::raw('GREATEST(comments_count_cached - 1, 0)'),
            ]);

        return response()->json([
            'code' => 'comment_deleted',
            'message' => 'Comment deleted.',
        ]);
    }

    public function update(Request $request, MemoryComment $comment)
    {
        if ($comment->user_id !== $request->user()->id) {
            return $this->errorResponse('comment_forbidden', 'Only the author can edit this comment.', 403);
        }

        $payload = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        $comment->update([
            'body' => $payload['body'],
        ]);

        $comment->load('user.profile')->loadCount('likes');
        $comment->setAttribute('is_liked', 0);
        $resource = MemoryCommentResource::make($comment);

        return response()->json([
            'comment' => $resource,
            'data' => $resource,
        ]);
    }

    public function like(Request $request, MemoryComment $comment)
    {
        $this->authorize('view', $comment->memory);

        $like = MemoryCommentLike::query()->firstOrCreate([
            'comment_id' => $comment->id,
            'user_id' => $request->user()->id,
        ]);

        if ($like->wasRecentlyCreated) {
            $actor = $request->user();
            $payload = [
                'memory_id' => $comment->memory_id,
                'comment_id' => $comment->id,
                'parent_comment_id' => $comment->parent_id,
                'snippet' => $this->snippet($comment->body),
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_username' => $actor->username,
                'actor_avatar_url' => $actor->profile?->avatar_url,
            ];

            if ($comment->user_id !== $request->user()->id) {
                InboxEvent::query()->create([
                    'user_id' => $comment->user_id,
                    'type' => 'comment_liked',
                    'data' => $payload,
                ]);
            }

            $memoryAuthorId = $comment->memory?->author_id;
            if (
                $memoryAuthorId
                && $memoryAuthorId !== $request->user()->id
                && $memoryAuthorId !== $comment->user_id
            ) {
                InboxEvent::query()->create([
                    'user_id' => $memoryAuthorId,
                    'type' => 'comment_liked',
                    'data' => $payload,
                ]);
            }
        }

        return response()->json([
            'message' => 'Comment liked.',
        ], 201);
    }

    public function unlike(Request $request, MemoryComment $comment)
    {
        $this->authorize('view', $comment->memory);

        MemoryCommentLike::query()
            ->where('comment_id', $comment->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'message' => 'Comment like removed.',
        ]);
    }

    public function likes(Request $request, MemoryComment $comment)
    {
        $this->authorize('view', $comment->memory);

        $likes = MemoryCommentLike::query()
            ->where('comment_id', $comment->id)
            ->with('user.profile')
            ->latest()
            ->get();

        $users = $likes->pluck('user')->filter()->values();

        return response()->json([
            'count' => $users->count(),
            'data' => UserResource::collection($users),
        ]);
    }

    protected function errorResponse(string $code, string $message, int $status)
    {
        return response()->json([
            'code' => $code,
            'message' => $message,
        ], $status);
    }

    protected function snippet(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }
        $cleaned = trim($text);
        if ($cleaned === '') {
            return null;
        }
        if (function_exists('mb_substr')) {
            return mb_substr($cleaned, 0, 120);
        }
        return substr($cleaned, 0, 120);
    }
}
