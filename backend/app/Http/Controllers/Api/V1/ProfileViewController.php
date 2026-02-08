<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileViewRequest;
use App\Http\Resources\ProfileViewResource;
use App\Models\ProfileSetting;
use App\Models\ProfileView;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileViewController extends Controller
{
    public function store(ProfileViewRequest $request, User $user)
    {
        $viewer = $request->user();

        if ($viewer && $viewer->id === $user->id) {
            return response()->json(['message' => 'Self views are ignored.']);
        }

        $viewerVisibility = $request->input('viewer_visibility', 'named');
        $viewerId = $viewerVisibility === 'anonymous' ? null : ($viewer?->id);

        $view = ProfileView::query()->create([
            'viewed_user_id' => $user->id,
            'viewer_user_id' => $viewerId,
            'viewer_visibility' => $viewerVisibility,
            'source' => $request->input('source'),
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'view' => ProfileViewResource::make($view->load('viewerUser')),
        ], 201);
    }

    public function summary(Request $request)
    {
        $user = $request->user();

        $since24h = Carbon::now()->subHours(24);
        $since7d = Carbon::now()->subDays(7);

        $baseQuery = ProfileView::query()->where('viewed_user_id', $user->id);

        $total24h = (clone $baseQuery)
            ->where('created_at', '>=', $since24h)
            ->count();
        $total7d = (clone $baseQuery)
            ->where('created_at', '>=', $since7d)
            ->count();

        $sourceRows = (clone $baseQuery)
            ->where('created_at', '>=', $since7d)
            ->select('source', DB::raw('count(*) as count'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get();

        $sources = $sourceRows->map(function ($row) use ($total7d) {
            $label = $row->source ?? 'unknown';
            $value = $total7d > 0 ? round(($row->count / $total7d) * 100, 1) : 0;
            return [
                'label' => $label,
                'value' => $value,
            ];
        });

        $settings = ProfileSetting::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        return response()->json([
            'total_24h' => $total24h,
            'total_7d' => $total7d,
            'sources' => $sources,
            'share_profile_views' => (bool) $settings->share_profile_views,
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $range = $request->query('range', '7d');
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min(50, $limit));
        $cursor = $request->query('cursor');
        $cursorData = $this->decodeCursor($cursor);
        $since = $this->rangeStart($range);

        $query = ProfileView::query()
            ->where('viewed_user_id', $user->id)
            ->where('created_at', '>=', $since)
            ->with('viewerUser.profile')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
        $this->applyCursorFilter($query, $cursorData, 'created_at', 'id');

        $views = $query->limit($limit + 1)->get();
        $hasMore = $views->count() > $limit;
        $items = $views->take($limit);
        $lastItem = $items->last();
        $nextCursor = $lastItem
            ? $this->encodeCursor($lastItem->created_at, $lastItem->id)
            : null;

        return response()->json([
            'range' => $range,
            'data' => ProfileViewResource::collection($items),
            'next_cursor' => $nextCursor,
            'has_more' => $hasMore,
        ]);
    }

    protected function rangeStart(string $range): Carbon
    {
        return match ($range) {
            '24h' => Carbon::now()->subHours(24),
            '30d' => Carbon::now()->subDays(30),
            default => Carbon::now()->subDays(7),
        };
    }

    protected function applyCursorFilter(
        Builder $query,
        ?array $cursorData,
        string $createdColumn,
        string $idColumn
    ): void {
        if (! $cursorData) {
            return;
        }

        $cursorTime = $cursorData['time'] ?? null;
        $cursorId = $cursorData['id'] ?? null;
        if (! $cursorTime || ! $cursorId) {
            return;
        }

        $query->where(function ($builder) use ($createdColumn, $idColumn, $cursorTime, $cursorId) {
            $builder
                ->where($createdColumn, '<', $cursorTime)
                ->orWhere(function ($inner) use ($createdColumn, $idColumn, $cursorTime, $cursorId) {
                    $inner->where($createdColumn, $cursorTime)
                        ->where($idColumn, '<', $cursorId);
                });
        });
    }

    protected function decodeCursor(?string $cursor): ?array
    {
        if (! $cursor) {
            return null;
        }

        $decoded = base64_decode($cursor, true);
        if (! $decoded) {
            return null;
        }

        $payload = json_decode($decoded, true);
        if (! is_array($payload)) {
            return null;
        }

        return [
            'time' => $payload['time'] ?? null,
            'id' => isset($payload['id']) ? (int) $payload['id'] : null,
        ];
    }

    protected function encodeCursor($time, int $id): string
    {
        $timestamp = $time instanceof \DateTimeInterface
            ? $time->format('Y-m-d H:i:s.u')
            : (string) $time;
        $payload = [
            'time' => $timestamp,
            'id' => $id,
        ];

        return base64_encode(json_encode($payload));
    }
}
