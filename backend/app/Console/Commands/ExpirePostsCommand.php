<?php

namespace App\Console\Commands;

use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpirePostsCommand extends Command
{
    protected $signature = 'posts:expire';
    protected $description = 'Mark posts as expired once their expiry window ends.';

    public function handle(): int
    {
        $now = Carbon::now();

        $expired = Post::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now)
            ->whereIn('status', ['vip', 'public'])
            ->update(['status' => 'expired']);

        $this->info("Expired {$expired} posts.");

        return self::SUCCESS;
    }
}
