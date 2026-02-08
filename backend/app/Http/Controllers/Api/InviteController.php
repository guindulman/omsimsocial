<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInviteRequest;
use App\Http\Resources\InviteResource;
use App\Http\Resources\UserResource;
use App\Models\ConnectionInvite;
use App\Models\ProfileSetting;
use App\Services\ConnectionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InviteController extends Controller
{
    public function store(CreateInviteRequest $request)
    {
        $user = $request->user();
        $token = Str::random(40);
        $expiresAt = $request->date('expires_at') ?? Carbon::now()->addDays(7);

        $invite = ConnectionInvite::query()->create([
            'inviter_user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expiresAt,
            'max_uses' => $request->integer('max_uses', 1),
            'uses_count' => 0,
            'status' => 'active',
        ]);

        return response()->json([
            'token' => $token,
            'invite' => InviteResource::make($invite),
        ], 201);
    }

    public function preview(string $token)
    {
        $invite = $this->resolveInvite($token);
        if (! $invite) {
            return response()->json(['message' => 'Invite not found.'], 404);
        }

        $invite->load('inviter.profile');

        return response()->json([
            'invite' => InviteResource::make($invite),
            'inviter' => UserResource::make($invite->inviter->load('profile')),
        ]);
    }

    public function accept(Request $request, string $token, ConnectionService $connectionService)
    {
        $invite = $this->resolveInvite($token);
        if (! $invite) {
            return response()->json(['message' => 'Invite not found.'], 404);
        }

        $user = $request->user();
        if ($invite->inviter_user_id === $user->id) {
            return response()->json(['message' => 'Cannot accept your own invite.'], 422);
        }

        $settings = ProfileSetting::query()->where('user_id', $invite->inviter_user_id)->first();
        if ($settings && $settings->allow_invites_from === 'nobody') {
            return response()->json(['message' => 'Invites are disabled for this user.'], 403);
        }

        if ($invite->uses_count >= $invite->max_uses) {
            $invite->update(['status' => 'used']);
            return response()->json(['message' => 'Invite already used.'], 410);
        }

        $this->createConnection($connectionService, $user->id, $invite->inviter_user_id, 'invite');

        $invite->increment('uses_count');
        if ($invite->uses_count >= $invite->max_uses) {
            $invite->update(['status' => 'used']);
        }

        return response()->json(['message' => 'Invite accepted.']);
    }

    public function revoke(Request $request, string $token)
    {
        $invite = $this->resolveInvite($token, allowExpired: true);
        if (! $invite) {
            return response()->json(['message' => 'Invite not found.'], 404);
        }

        if ($invite->inviter_user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not authorized to revoke this invite.'], 403);
        }

        $invite->update(['status' => 'revoked']);

        return response()->json(['message' => 'Invite revoked.']);
    }

    protected function resolveInvite(string $token, bool $allowExpired = false): ?ConnectionInvite
    {
        $invite = ConnectionInvite::query()
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if (! $invite) {
            return null;
        }

        if (! $allowExpired && $invite->expires_at && $invite->expires_at->isPast()) {
            $invite->update(['status' => 'expired']);
            return null;
        }

        if (! $allowExpired && $invite->status !== 'active') {
            return null;
        }

        return $invite;
    }

    protected function createConnection(ConnectionService $connectionService, int $userId, int $targetId, string $method): void
    {
        [$userA, $userB] = $connectionService->normalizePair($userId, $targetId);

        \App\Models\Connection::query()->firstOrCreate(
            ['user_a_id' => $userA, 'user_b_id' => $userB],
            ['method' => $method]
        );
    }
}
