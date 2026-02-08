<?php

namespace App\Http\Middleware;

use App\Models\Block;
use App\Models\Connection;
use App\Models\Memory;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotBlocked
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $actor = $request->user();

        if (! $actor) {
            return $next($request);
        }

        $targetIds = $this->resolveTargetIds($request);

        if (empty($targetIds)) {
            return $next($request);
        }

        $blocked = Connection::query()
            ->where('status', 'blocked')
            ->where(function ($query) use ($actor, $targetIds) {
                $query->where(function ($inner) use ($actor, $targetIds) {
                    $inner->where('requester_id', $actor->id)
                        ->whereIn('addressee_id', $targetIds);
                })->orWhere(function ($inner) use ($actor, $targetIds) {
                    $inner->whereIn('requester_id', $targetIds)
                        ->where('addressee_id', $actor->id);
                });
            })
            ->exists();

        if (! $blocked) {
            $blocked = Block::query()
                ->where(function ($query) use ($actor, $targetIds) {
                    $query->where(function ($inner) use ($actor, $targetIds) {
                        $inner->where('blocker_user_id', $actor->id)
                            ->whereIn('blocked_user_id', $targetIds);
                    })->orWhere(function ($inner) use ($actor, $targetIds) {
                        $inner->whereIn('blocker_user_id', $targetIds)
                            ->where('blocked_user_id', $actor->id);
                    });
                })
                ->exists();
        }

        if ($blocked) {
            return response()->json([
                'message' => 'Access denied due to a block relationship.',
            ], 403);
        }

        return $next($request);
    }

    /**
     * @return int[]
     */
    protected function resolveTargetIds(Request $request): array
    {
        $targets = [];

        $routeUser = $request->route('user');
        if ($routeUser instanceof User) {
            $targets[] = $routeUser->id;
        } elseif (is_numeric($routeUser)) {
            $targets[] = (int) $routeUser;
        }

        $routeMemory = $request->route('memory');
        if ($routeMemory instanceof Memory) {
            $targets[] = $routeMemory->author_id;
        }

        foreach (['user_id', 'recipient_id', 'direct_user_id', 'addressee_id'] as $field) {
            $value = $request->input($field);
            if (is_numeric($value)) {
                $targets[] = (int) $value;
            }
        }

        return array_values(array_unique(array_filter($targets)));
    }
}
