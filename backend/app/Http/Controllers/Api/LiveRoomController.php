<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LiveRoomChatRequest;
use App\Http\Requests\LiveRoomKickRequest;
use App\Http\Requests\LiveRoomStartRequest;
use App\Http\Resources\LiveChatMessageResource;
use App\Http\Resources\LiveRoomResource;
use App\Models\LiveChatMessage;
use App\Models\LiveRoom;
use App\Models\LiveRoomMember;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LiveRoomController extends Controller
{
    public function start(LiveRoomStartRequest $request)
    {
        $user = $request->user();

        $room = LiveRoom::query()->create([
            'host_user_id' => $user->id,
            'title' => $request->input('title'),
            'visibility' => $request->input('visibility', 'connections'),
            'status' => 'live',
            'provider_stream_id' => null,
            'invite_token_hash' => null,
            'started_at' => Carbon::now(),
            'ended_at' => null,
        ]);

        LiveRoomMember::query()->create([
            'room_id' => $room->id,
            'user_id' => $user->id,
            'role' => 'mod',
        ]);

        return response()->json([
            'room' => LiveRoomResource::make($room->load('host')),
        ], 201);
    }

    public function end(Request $request, LiveRoom $room)
    {
        $this->authorize('manage', $room);

        $room->update([
            'status' => 'ended',
            'ended_at' => Carbon::now(),
        ]);

        return response()->json([
            'room' => LiveRoomResource::make($room->load('host')),
        ]);
    }

    public function show(Request $request, LiveRoom $room)
    {
        $this->authorize('view', $room);

        return response()->json([
            'room' => LiveRoomResource::make($room->load('host')),
        ]);
    }

    public function inviteLink(Request $request, LiveRoom $room)
    {
        $this->authorize('manage', $room);

        $token = Str::random(40);
        $room->update([
            'invite_token_hash' => hash('sha256', $token),
        ]);

        return response()->json([
            'invite_token' => $token,
        ]);
    }

    public function chat(LiveRoomChatRequest $request, LiveRoom $room)
    {
        $this->authorize('view', $room);

        LiveRoomMember::query()->firstOrCreate([
            'room_id' => $room->id,
            'user_id' => $request->user()->id,
        ], [
            'role' => 'viewer',
        ]);

        $message = LiveChatMessage::query()->create([
            'room_id' => $room->id,
            'user_id' => $request->user()->id,
            'message' => $request->input('message'),
        ]);

        return response()->json([
            'message' => LiveChatMessageResource::make($message->load('user')),
        ], 201);
    }

    public function kick(LiveRoomKickRequest $request, LiveRoom $room)
    {
        $this->authorize('manage', $room);

        LiveRoomMember::query()
            ->where('room_id', $room->id)
            ->where('user_id', $request->input('user_id'))
            ->delete();

        return response()->json(['message' => 'Member removed.']);
    }
}
