<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('connection_requests')) {
            Schema::create('connection_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('from_user_id')->index()->constrained('users')->cascadeOnDelete();
                $table->foreignId('to_user_id')->index()->constrained('users')->cascadeOnDelete();
                $table->enum('status', ['pending', 'accepted', 'declined', 'canceled'])->default('pending');
                $table->text('message')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasIndex('connection_requests', 'connection_requests_pending_pair_unique')) {
            DB::statement(
                "CREATE UNIQUE INDEX connection_requests_pending_pair_unique ON connection_requests (LEAST(from_user_id, to_user_id), GREATEST(from_user_id, to_user_id)) WHERE status = 'pending'"
            );
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS connection_requests_pending_pair_unique');
        Schema::dropIfExists('connection_requests');
    }
};
