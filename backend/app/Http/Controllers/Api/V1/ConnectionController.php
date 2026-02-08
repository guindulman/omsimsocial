<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptInviteRequest;
use App\Http\Requests\CreateConnectionInviteRequest;
use App\Http\Requests\HandshakeConfirmRequest;
use App\Http\Requests\HandshakeInitiateRequest;
use App\Http\Requests\UpdateConnectionRequest;
use App\Http\Resources\ConnectionResource;
use App\Models\Connection;
use App\Models\FriendVerificationCode;
use App\Models\InboxEvent;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ConnectionController extends Controller
{
    public function invite(CreateConnectionInviteRequest $request)
    {
        $user = $request->user();
        $code = $this->generateCode();

        $connection = Connection::query()->create([
            'requester_id' => $user->id,
            'status' => 'pending',
            'method' => $request->input('method') ?: 'invite',
            'type' => $request->input('type') ?: 'friend',
            'level' => $request->input('level') ?: 'acquaintance',
            'invite_code' => $code,
        ]);

        return response()->json([
            'connection' => ConnectionResource::make($connection->load(['requester.profile'])),
            'invite_code' => $code,
            'invite_link' => rtrim(config('app.url'), '/').'/invite/'.$code,
        ], 201);
    }

    public function acceptInvite(AcceptInviteRequest $request)
    {
        $user = $request->user();
        $code = $request->string('code');

        $connection = Connection::query()
            ->where('invite_code', $code)
            ->where('status', 'pending')
            ->first();

        if (! $connection) {
            return $this->errorResponse('invite_not_found', 'Invite not found.', 404);
        }

        if ($connection->requester_id === $user->id) {
            return $this->errorResponse('invite_self_accept', 'Invite cannot be accepted by requester.', 422);
        }

        if ($connection->addressee_id && $connection->addressee_id !== $user->id) {
            return $this->errorResponse('invite_claimed', 'Invite already claimed.', 409);
        }

        $lowId = min($connection->requester_id, $user->id);
        $highId = max($connection->requester_id, $user->id);

        $connection->update([
            'addressee_id' => $user->id,
            'status' => 'accepted',
            'invite_code' => null,
            'user_low_id' => $lowId,
            'user_high_id' => $highId,
            'verified_at' => null,
        ]);

        $this->createConnectionEvents($connection);

        return response()->json([
            'connection' => ConnectionResource::make($connection->load(['requester.profile', 'addressee.profile'])),
            'first_memory_draft' => $this->firstMemoryDraft($connection, $user),
        ]);
    }

    public function initiateHandshake(HandshakeInitiateRequest $request)
    {
        $user = $request->user();
        $code = $this->generateCode();

        FriendVerificationCode::query()
            ->where('user_id', $user->id)
            ->delete();

        FriendVerificationCode::query()->create([
            'user_id' => $user->id,
            'code' => $code,
        ]);

        return response()->json([
            'handshake_code' => $code,
        ], 201);
    }

    public function confirmHandshake(HandshakeConfirmRequest $request, FriendshipService $friendshipService)
    {
        $user = $request->user();
        $rawCode = $request->string('code')->toString();
        $code = $this->normalizeHandshakeCode($rawCode);

        if ($code === '') {
            return $this->errorResponse('handshake_invalid', 'Handshake code is invalid.', 422);
        }

        $verification = FriendVerificationCode::query()
            ->where('code', $code)
            ->first();

        if (! $verification) {
            return $this->errorResponse('handshake_not_found', 'Handshake not found.', 404);
        }

        if ($verification->user_id === $user->id) {
            return $this->errorResponse('handshake_self_confirm', 'Handshake cannot be confirmed by requester.', 422);
        }

        if (! $friendshipService->exists($verification->user_id, $user->id)) {
            return $this->errorResponse('friendship_required', 'Friendship required to verify.', 409);
        }

        $friendship = $friendshipService->verifyFriendship($verification->user_id, $user->id);
        $verification->delete();

        return response()->json([
            'friendship' => [
                'id' => $friendship?->id,
                'verified_at' => $friendship?->verified_at,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $connections = Connection::query()
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('addressee_id', $user->id);
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->string('status'));
            })
            ->latest()
            ->get();

        return response()->json([
            'data' => ConnectionResource::collection($connections->load(['requester.profile', 'addressee.profile'])),
        ]);
    }

    public function update(UpdateConnectionRequest $request, Connection $connection)
    {
        $user = $request->user();

        if (! $this->isParticipant($connection, $user)) {
            return $this->errorResponse('not_participant', 'Forbidden.', 403);
        }

        $connection->update([
            'type' => $request->input('type') ?: $connection->type,
            'level' => $request->input('level') ?: $connection->level,
            'muted_at' => $request->boolean('muted') ? now() : null,
        ]);

        return response()->json([
            'connection' => ConnectionResource::make($connection->load(['requester.profile', 'addressee.profile'])),
        ]);
    }

    public function block(Request $request, Connection $connection)
    {
        $user = $request->user();

        if (! $this->isParticipant($connection, $user)) {
            return $this->errorResponse('not_participant', 'Forbidden.', 403);
        }

        $connection->update([
            'status' => 'blocked',
        ]);

        return response()->json([
            'connection' => ConnectionResource::make($connection->load(['requester.profile', 'addressee.profile'])),
        ]);
    }

    protected function isParticipant(Connection $connection, User $user): bool
    {
        return $connection->requester_id === $user->id || $connection->addressee_id === $user->id;
    }

    protected function createConnectionEvents(Connection $connection): void
    {
        if (! $connection->addressee_id) {
            return;
        }

        $data = [
            'connection_id' => $connection->id,
            'requester_id' => $connection->requester_id,
            'addressee_id' => $connection->addressee_id,
        ];

        InboxEvent::query()->create([
            'user_id' => $connection->requester_id,
            'type' => 'connection_request',
            'data' => $data,
        ]);

        InboxEvent::query()->create([
            'user_id' => $connection->addressee_id,
            'type' => 'connection_request',
            'data' => $data,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function firstMemoryDraft(Connection $connection, User $viewer): array
    {
        $otherUserId = $connection->requester_id === $viewer->id
            ? $connection->addressee_id
            : $connection->requester_id;

        return [
            'scope' => 'private',
            'direct_user_id' => $otherUserId,
            'body' => 'First memory with '.$this->otherName($connection, $viewer).'.',
        ];
    }

    protected function otherName(Connection $connection, User $viewer): string
    {
        $otherId = $connection->requester_id === $viewer->id
            ? $connection->addressee_id
            : $connection->requester_id;

        return User::query()->find($otherId)?->name ?? 'your new connection';
    }

    protected function generateCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (
            Connection::query()->where('invite_code', $code)->exists() ||
            FriendVerificationCode::query()->where('code', $code)->exists()
        );

        return $code;
    }

    protected function normalizeHandshakeCode(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        $candidate = $value;
        $parsed = parse_url($value);
        if (is_array($parsed) && ! empty($parsed['query'])) {
            parse_str($parsed['query'], $params);
            if (! empty($params['code'])) {
                $candidate = (string) $params['code'];
            }
        } elseif (preg_match('/code=([a-zA-Z0-9]+)/', $value, $matches)) {
            $candidate = $matches[1];
        }

        $candidate = preg_replace('/[^a-zA-Z0-9]/', '', (string) $candidate);
        if (! is_string($candidate)) {
            return '';
        }

        return strtoupper($candidate);
    }

    protected function errorResponse(string $code, string $message, int $status)
    {
        return response()->json([
            'code' => $code,
            'message' => $message,
        ], $status);
    }
}
