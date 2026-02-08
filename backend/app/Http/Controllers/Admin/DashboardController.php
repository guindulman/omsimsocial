<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\CallSession;
use App\Models\Connection;
use App\Models\LiveRoom;
use App\Models\Memory;
use App\Models\MemoryComment;
use App\Models\Message;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Models\UserModerationNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = now();
        $onlineCutoff = $now->copy()->subMinutes(15)->timestamp;

        $stats = [
            'users_total' => User::count(),
            'users_active' => User::where('is_active', true)->count(),
            'users_private' => User::where('is_private', true)->count(),
            'users_moderators' => User::where('is_moderator', true)->count(),
            'users_new_7d' => User::where('created_at', '>=', $now->copy()->subDays(7))->count(),
            'users_online' => DB::table('sessions')->where('last_activity', '>=', $onlineCutoff)->count(),
            'memories_total' => Memory::count(),
            'memories_today' => Memory::whereDate('created_at', $now->toDateString())->count(),
            'comments_total' => MemoryComment::count(),
            'messages_24h' => Message::where('created_at', '>=', $now->copy()->subDay())->count(),
            'reports_open' => Report::count(),
            'calls_active' => CallSession::whereIn('status', ['requested', 'accepted'])->count(),
            'live_rooms' => LiveRoom::where('status', 'live')->count(),
            'connections_pending' => Connection::where('status', 'pending')->count(),
        ];

        $health = [
            'database' => $this->databaseHealthy(),
            'realtime' => config('broadcasting.default') === 'reverb',
            'storage' => config('filesystems.default') === 'public',
            'messaging' => $stats['messages_24h'] > 0,
            'calls' => $stats['calls_active'] > 0,
            'stories' => Memory::where('scope', 'story')->where('expires_at', '>', $now)->count() > 0,
        ];

        $recentReports = Report::with('reporter')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $recentMemories = Memory::with('author')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        $recentUsers = User::orderByDesc('created_at')
            ->limit(6)
            ->get();

        $recentMessages = Message::with(['sender', 'recipient'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        return view('admin.dashboard', [
            'adminName' => config('admin.name'),
            'now' => $now,
            'stats' => $stats,
            'health' => $health,
            'recentReports' => $recentReports,
            'recentMemories' => $recentMemories,
            'recentUsers' => $recentUsers,
            'recentMessages' => $recentMessages,
        ]);
    }

    public function users(Request $request)
    {
        $query = User::query();
        $onlineCutoff = now()->subMinutes(15)->timestamp;
        $filter = $request->string('filter')->toString();
        $search = $request->string('q')->toString();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'ilike', "%{$search}%")
                    ->orWhere('username', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if ($filter === 'active') {
            $query->where('is_active', true);
        } elseif ($filter === 'suspended') {
            $query->where('is_active', false);
        } elseif ($filter === 'moderators') {
            $query->where('is_moderator', true);
        } elseif ($filter === 'private') {
            $query->where('is_private', true);
        } elseif ($filter === 'new') {
            $query->where('created_at', '>=', now()->subDays(7));
        }

        $users = $query->orderByDesc('created_at')->paginate(20)->withQueryString();
        $userIds = $users->pluck('id')->filter()->values();
        $lastSeenRows = DB::table('sessions')
            ->select('user_id', DB::raw('max(last_activity) as last_activity'))
            ->whereIn('user_id', $userIds)
            ->groupBy('user_id')
            ->get();
        $lastSeenMap = $lastSeenRows->pluck('last_activity', 'user_id');
        $noteRows = UserModerationNote::whereIn('user_id', $userIds)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('user_id')
            ->map->first();
        $noteCounts = UserModerationNote::select('user_id', DB::raw('count(*) as note_count'))
            ->whereIn('user_id', $userIds)
            ->groupBy('user_id')
            ->get()
            ->pluck('note_count', 'user_id');
        $stats = [
            'total' => User::count(),
            'active' => User::where('is_active', true)->count(),
            'moderators' => User::where('is_moderator', true)->count(),
            'online' => DB::table('sessions')->where('last_activity', '>=', $onlineCutoff)->count(),
        ];

        return view('admin.users', [
            'adminName' => config('admin.name'),
            'users' => $users,
            'filter' => $filter,
            'search' => $search,
            'lastSeenMap' => $lastSeenMap,
            'noteMap' => $noteRows,
            'noteCounts' => $noteCounts,
            'onlineCutoff' => $onlineCutoff,
            'stats' => $stats,
        ]);
    }

    public function showUser(User $user)
    {
        $lastActivity = DB::table('sessions')
            ->where('user_id', $user->id)
            ->max('last_activity');
        $onlineCutoff = now()->subMinutes(15)->timestamp;

        $stats = [
            'memories' => Memory::where('author_id', $user->id)->count(),
            'comments' => MemoryComment::where('user_id', $user->id)->count(),
            'messages_sent' => Message::where('sender_id', $user->id)->count(),
            'messages_received' => Message::where('recipient_id', $user->id)->count(),
            'connections' => Connection::where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('addressee_id', $user->id);
            })->count(),
            'reports_against' => Report::where('target_type', 'user')
                ->where('target_id', $user->id)
                ->count(),
            'reports_filed' => Report::where('reporter_user_id', $user->id)->count(),
        ];

        $recentMemories = Memory::with('author')
            ->where('author_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();
        $recentComments = MemoryComment::with('memory')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();
        $recentMessages = Message::with(['sender', 'recipient'])
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('recipient_id', $user->id);
            })
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();
        $notes = UserModerationNote::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
        $reportsAgainst = Report::where('target_type', 'user')
            ->where('target_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return view('admin.user-detail', [
            'adminName' => config('admin.name'),
            'user' => $user,
            'stats' => $stats,
            'lastActivity' => $lastActivity,
            'onlineCutoff' => $onlineCutoff,
            'recentMemories' => $recentMemories,
            'recentComments' => $recentComments,
            'recentMessages' => $recentMessages,
            'notes' => $notes,
            'reportsAgainst' => $reportsAgainst,
        ]);
    }

    public function reports(Request $request)
    {
        $query = Report::with('reporter');
        $type = $request->string('type')->toString();
        if ($type !== '') {
            $query->where('target_type', $type);
        }

        $reports = $query->orderByDesc('created_at')->paginate(20)->withQueryString();
        $counts = Report::select('target_type', DB::raw('count(*) as total'))
            ->groupBy('target_type')
            ->orderByDesc('total')
            ->get();

        return view('admin.reports', [
            'adminName' => config('admin.name'),
            'reports' => $reports,
            'type' => $type,
            'counts' => $counts,
        ]);
    }

    public function audit(Request $request)
    {
        $action = $request->string('action')->toString();
        $query = AdminAuditLog::query();

        if ($action !== '') {
            $query->where('action', 'like', "%{$action}%");
        }

        $logs = $query->orderByDesc('created_at')->paginate(30)->withQueryString();

        return view('admin.audit', [
            'adminName' => config('admin.name'),
            'logs' => $logs,
            'action' => $action,
        ]);
    }

    public function toggleUser(User $user)
    {
        $user->is_active = ! $user->is_active;
        $user->save();
        $this->logAction('user.toggle', $user->id, 'user', [
            'is_active' => $user->is_active,
        ]);

        return back();
    }

    public function toggleModerator(User $user)
    {
        $user->is_moderator = ! $user->is_moderator;
        $user->save();
        $this->logAction('user.moderator', $user->id, 'user', [
            'is_moderator' => $user->is_moderator,
        ]);

        return back();
    }

    public function bulkUsers(Request $request)
    {
        $request->validate([
            'action' => ['required', 'string'],
            'user_ids' => ['array'],
            'user_ids.*' => ['integer'],
            'note' => ['nullable', 'string', 'max:2000'],
            'note_template' => ['nullable', 'string'],
        ]);

        $userIds = collect($request->input('user_ids', []))
            ->filter()
            ->unique()
            ->values();

        if ($userIds->isEmpty()) {
            return back();
        }

        $action = $request->input('action');
        if ($action === 'add_note') {
            $note = $this->resolveNoteFromRequest($request);
            if (! $note) {
                return back()->withErrors(['note' => 'Select a template or enter a note.']);
            }
            $rows = $userIds->map(function ($id) use ($note) {
                return [
                    'user_id' => $id,
                    'author' => session()->get('admin_email'),
                    'note' => $note,
                    'created_at' => now(),
                ];
            })->all();

            UserModerationNote::query()->insert($rows);
            $this->logAction('users.bulk_note', null, 'user', [
                'count' => $userIds->count(),
                'note_preview' => substr($note, 0, 120),
            ]);

            return back();
        }

        $updates = [];
        if ($action === 'suspend') {
            $updates['is_active'] = false;
        } elseif ($action === 'activate') {
            $updates['is_active'] = true;
        } elseif ($action === 'make_moderator') {
            $updates['is_moderator'] = true;
        } elseif ($action === 'remove_moderator') {
            $updates['is_moderator'] = false;
        }

        if ($updates) {
            User::whereIn('id', $userIds)->update($updates);
            $this->logAction('users.bulk', null, 'user', [
                'action' => $action,
                'user_ids' => $userIds->all(),
            ]);
        }

        return back();
    }

    public function addUserNote(Request $request, User $user)
    {
        $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
            'note_template' => ['nullable', 'string'],
        ]);

        $note = $this->resolveNoteFromRequest($request);
        if (! $note) {
            return back()->withErrors(['note' => 'Select a template or enter a note.']);
        }

        UserModerationNote::query()->create([
            'user_id' => $user->id,
            'author' => $request->session()->get('admin_email'),
            'note' => $note,
        ]);

        $this->logAction('user.note', $user->id, 'user', [
            'note_preview' => substr($note, 0, 120),
        ]);

        return back();
    }

    public function deleteMemory(Memory $memory)
    {
        $memory->delete();
        $this->logAction('memory.delete', $memory->id, 'memory');

        return back();
    }

    public function deleteComment(MemoryComment $comment)
    {
        $comment->delete();
        $this->logAction('comment.delete', $comment->id, 'comment');

        return back();
    }

    public function deleteMessage(Message $message)
    {
        $message->deleted_for_sender_at = now();
        $message->deleted_for_recipient_at = now();
        $message->save();
        $this->logAction('message.delete', $message->id, 'message');

        return back();
    }

    public function dismissReport(Report $report)
    {
        $report->delete();
        $this->logAction('report.dismiss', $report->id, 'report');

        return back();
    }

    public function removeReportTarget(Report $report)
    {
        DB::transaction(function () use ($report) {
            $targetType = $report->target_type;
            $targetId = $report->target_id;

            if ($targetType === 'user') {
                $user = User::find($targetId);
                if ($user) {
                    $user->is_active = false;
                    $user->save();
                }
            } elseif ($targetType === 'memory' || $targetType === 'story') {
                $memory = Memory::withTrashed()->find($targetId);
                if ($memory && ! $memory->trashed()) {
                    $memory->delete();
                }
            } elseif ($targetType === 'comment') {
                $comment = MemoryComment::find($targetId);
                if ($comment) {
                    $comment->delete();
                }
            } elseif ($targetType === 'message') {
                $message = Message::find($targetId);
                if ($message) {
                    $message->deleted_for_sender_at = now();
                    $message->deleted_for_recipient_at = now();
                    $message->save();
                }
            } elseif ($targetType === 'live_room') {
                $room = LiveRoom::find($targetId);
                if ($room) {
                    $room->status = 'ended';
                    $room->save();
                }
            } elseif ($targetType === 'post') {
                $post = Post::find($targetId);
                if ($post) {
                    $post->delete();
                }
            }

            $report->delete();
        });
        $this->logAction('report.remove_target', $report->id, 'report', [
            'target_type' => $report->target_type,
            'target_id' => $report->target_id,
        ]);

        return back();
    }

    private function databaseHealthy(): bool
    {
        try {
            DB::select('select 1');
        } catch (Throwable) {
            return false;
        }

        return true;
    }

    private function logAction(string $action, ?int $targetId = null, ?string $targetType = null, array $metadata = []): void
    {
        AdminAuditLog::query()->create([
            'actor' => session()->get('admin_email'),
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $metadata ?: null,
        ]);
    }

    private function resolveNoteFromRequest(Request $request): ?string
    {
        $note = trim((string) $request->input('note', ''));
        $templateKey = $request->input('note_template');
        $templates = collect(config('admin.note_templates', []))
            ->filter(fn ($template) => is_array($template) && isset($template['key']))
            ->keyBy('key');
        $templateBody = '';
        if ($templateKey && $templates->has($templateKey)) {
            $templateBody = (string) ($templates->get($templateKey)['body'] ?? '');
        }

        if ($note === '' && $templateBody === '') {
            return null;
        }

        $combined = $note !== '' && $templateBody !== ''
            ? $templateBody . "\n\n" . $note
            : ($note !== '' ? $note : $templateBody);

        return substr($combined, 0, 2000);
    }
}
