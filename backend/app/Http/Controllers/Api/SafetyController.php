<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportRequest;
use App\Models\Block;
use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SafetyController extends Controller
{
    public function report(ReportRequest $request)
    {
        $notes = $request->input('notes');
        if ($notes === null) {
            $notes = $request->input('details');
        }

        $report = Report::query()->create([
            'reporter_user_id' => $request->user()->id,
            'target_type' => $request->input('target_type'),
            'target_id' => $request->input('target_id'),
            'reason' => $request->input('reason'),
            'notes' => $notes,
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Report received.',
            'report' => [
                'id' => $report->id,
                'target_type' => $report->target_type,
                'target_id' => $report->target_id,
                'reason' => $report->reason,
                'notes' => $report->notes,
                'created_at' => $report->created_at,
            ],
        ], 201);
    }

    public function block(Request $request, User $user)
    {
        $actor = $request->user();

        if ($actor->id === $user->id) {
            return response()->json(['message' => 'Cannot block yourself.'], 422);
        }

        Block::query()->firstOrCreate([
            'blocker_user_id' => $actor->id,
            'blocked_user_id' => $user->id,
        ], [
            'created_at' => Carbon::now(),
        ]);

        return response()->json(['message' => 'User blocked.']);
    }
}
