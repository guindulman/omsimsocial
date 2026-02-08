<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('follow_requests')) {
            Schema::create('follow_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('requester_id')->index()->constrained('users')->cascadeOnDelete();
                $table->foreignId('target_id')->index()->constrained('users')->cascadeOnDelete();
                $table->enum('status', ['pending', 'accepted', 'declined', 'canceled'])->default('pending');
                $table->timestamps();
            });
        }

        if (! Schema::hasIndex('follow_requests', 'follow_requests_pending_pair_unique')) {
            DB::statement(
                "CREATE UNIQUE INDEX follow_requests_pending_pair_unique ON follow_requests (requester_id, target_id) WHERE status = 'pending'"
            );
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS follow_requests_pending_pair_unique');
        Schema::dropIfExists('follow_requests');
    }
};
