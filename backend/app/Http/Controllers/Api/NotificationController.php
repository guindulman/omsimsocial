<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'notifications' => NotificationResource::collection($notifications),
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $notification->update([
            'read_at' => Carbon::now(),
        ]);

        return response()->json([
            'notification' => NotificationResource::make($notification),
        ]);
    }
}
