<?php

namespace App\Console\Commands;

use App\Models\Adoption;
use App\Models\Memory;
use App\Models\MemoryComment;
use App\Models\MemoryReshare;
use App\Models\Reaction;
use Illuminate\Console\Command;

class BackfillMemoryCounts extends Command
{
    protected $signature = 'memories:backfill-counts {--from_id=} {--to_id=} {--chunk=500}';

    protected $description = 'Backfill cached counts on memories.';

    public function handle(): int
    {
        $fromId = $this->option('from_id');
        $toId = $this->option('to_id');
        $chunk = (int) $this->option('chunk') ?: 500;

        $query = Memory::query()
            ->when($fromId, fn ($builder) => $builder->where('id', '>=', (int) $fromId))
            ->when($toId, fn ($builder) => $builder->where('id', '<=', (int) $toId))
            ->orderBy('id');

        $total = $query->count();
        $this->info("Backfilling {$total} memories...");

        $query->chunkById($chunk, function ($memories) {
            foreach ($memories as $memory) {
                $comments = MemoryComment::query()->where('memory_id', $memory->id)->count();
                $hearts = Reaction::query()
                    ->where('memory_id', $memory->id)
                    ->where('emoji', 'heart')
                    ->count();
                $saves = Adoption::query()->where('memory_id', $memory->id)->count();
                $reshares = MemoryReshare::query()->where('memory_id', $memory->id)->count();

                $memory->update([
                    'comments_count_cached' => $comments,
                    'hearts_count_cached' => $hearts,
                    'saves_count_cached' => $saves,
                    'reshares_count_cached' => $reshares,
                ]);
            }

            $this->info("Processed {$memories->count()} memories...");
        });

        $this->info('Backfill complete.');

        return Command::SUCCESS;
    }
}
