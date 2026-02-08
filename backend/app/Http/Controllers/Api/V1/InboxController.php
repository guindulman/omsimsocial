<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InboxEventResource;
use App\Models\FollowRequest;
use App\Models\FriendRequest;
use App\Models\InboxEvent;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    public function adoptionNotes(Request $request)
    {
        $events = InboxEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('type', ['adoption_note', 'memory_saved'])
            ->latest()
            ->get();

        return InboxEventResource::collection($events);
    }

    public function requests(Request $request)
    {
        $events = InboxEvent::query()
            ->where('user_id', $request->user()->id)
            ->where('type', 'connection_request')
            ->latest()
            ->get();

        return InboxEventResource::collection($events);
    }

    public function activity(Request $request)
    {
        $events = InboxEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('type', [
                'adoption_note',
                'memory_saved',
                'memory_liked',
                'memory_commented',
                'comment_liked',
                'comment_replied',
                'memory_reshared',
            ])
            ->latest()
            ->get();

        return InboxEventResource::collection($events);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $activityCount = InboxEvent::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->whereIn('type', [
                'adoption_note',
                'memory_saved',
                'memory_liked',
                'memory_commented',
                'comment_liked',
                'comment_replied',
                'memory_reshared',
            ])
            ->count();

        $friendRequests = FriendRequest::query()
            ->where('to_user_id', $userId)
            ->where('status', 'pending')
            ->count();

        $followRequests = FollowRequest::query()
            ->where('target_id', $userId)
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'activity' => $activityCount,
            'friend_requests' => $friendRequests,
            'follow_requests' => $followRequests,
            'total' => $activityCount + $friendRequests + $followRequests,
        ]);
    }

    public function markActivityRead(Request $request)
    {
        InboxEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereIn('type', [
                'adoption_note',
                'memory_saved',
                'memory_liked',
                'memory_commented',
                'comment_liked',
                'comment_replied',
                'memory_reshared',
            ])
            ->update(['read_at' => now()]);

        return response()->json([
            'ok' => true,
        ]);
    }

    public function markEventRead(Request $request, InboxEvent $event)
    {
        if ($event->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if (! $event->read_at) {
            InboxEvent::query()
                ->where('id', $event->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
            $event->refresh();
        }

        $remainingUnread = InboxEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereIn('type', [
                'adoption_note',
                'memory_saved',
                'memory_liked',
                'memory_commented',
                'comment_liked',
                'comment_replied',
                'memory_reshared',
            ])
            ->count();

        return response()->json([
            'ok' => true,
            'event' => InboxEventResource::make($event),
            'unread_count' => $remainingUnread,
        ]);
    }
}
