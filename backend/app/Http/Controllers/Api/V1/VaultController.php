<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemoryResource;
use App\Http\Resources\VaultItemResource;
use App\Models\TimeCapsule;
use App\Models\VaultItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VaultController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $latestAdopted = VaultItem::query()
            ->where('user_id', $user->id)
            ->where('source', 'adoption')
            ->with(['memory.author.profile', 'memory.media'])
            ->latest()
            ->take(5)
            ->get();

        $byPeople = VaultItem::query()
            ->where('user_id', $user->id)
            ->join('memories', 'memories.id', '=', 'vault_items.memory_id')
            ->select('memories.author_id', DB::raw('count(*) as total'))
            ->groupBy('memories.author_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $byCircles = VaultItem::query()
            ->where('user_id', $user->id)
            ->join('memories', 'memories.id', '=', 'vault_items.memory_id')
            ->whereNotNull('memories.circle_id')
            ->select('memories.circle_id', DB::raw('count(*) as total'))
            ->groupBy('memories.circle_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $timeCapsulesCount = TimeCapsule::query()
            ->where('owner_id', $user->id)
            ->count();

        return response()->json([
            'adopted' => VaultItemResource::collection($latestAdopted),
            'by_people' => $byPeople,
            'by_circles' => $byCircles,
            'time_capsules_count' => $timeCapsulesCount,
        ]);
    }

    public function adopted(Request $request)
    {
        $items = VaultItem::query()
            ->where('user_id', $request->user()->id)
            ->where('source', 'adoption')
            ->with(['memory.author.profile', 'memory.media'])
            ->latest()
            ->get();

        return response()->json([
            'data' => VaultItemResource::collection($items),
        ]);
    }

    public function onThisDay(Request $request)
    {
        $today = now();

        $items = VaultItem::query()
            ->where('user_id', $request->user()->id)
            ->whereHas('memory', function ($query) use ($today) {
                $query->whereMonth('created_at', $today->month)
                    ->whereDay('created_at', $today->day);
            })
            ->with(['memory.author.profile', 'memory.media'])
            ->latest()
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($items->pluck('memory')),
        ]);
    }
}
