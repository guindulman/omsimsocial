<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (Schema::hasTable('messages')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS messages_recipient_unread_idx ON messages (recipient_id) WHERE read_at IS NULL'
            );
            DB::statement(
                'CREATE INDEX IF NOT EXISTS messages_recipient_sender_unread_idx ON messages (recipient_id, sender_id) WHERE read_at IS NULL'
            );
            if (Schema::hasColumn('messages', 'thread_id')) {
                DB::statement(
                    'CREATE INDEX IF NOT EXISTS messages_thread_created_idx ON messages (thread_id, created_at)'
                );
            }
        }

        if (Schema::hasTable('inbox_events')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS inbox_events_user_unread_idx ON inbox_events (user_id) WHERE read_at IS NULL'
            );
            DB::statement(
                'CREATE INDEX IF NOT EXISTS inbox_events_user_id_desc_idx ON inbox_events (user_id, id DESC)'
            );
        }

        if (Schema::hasTable('friend_requests')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS friend_requests_to_status_idx ON friend_requests (to_user_id, status)'
            );
        }

        if (Schema::hasTable('follow_requests')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS follow_requests_target_status_idx ON follow_requests (target_id, status)'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS messages_recipient_unread_idx');
        DB::statement('DROP INDEX IF EXISTS messages_recipient_sender_unread_idx');
        DB::statement('DROP INDEX IF EXISTS messages_thread_created_idx');
        DB::statement('DROP INDEX IF EXISTS inbox_events_user_unread_idx');
        DB::statement('DROP INDEX IF EXISTS inbox_events_user_id_desc_idx');
        DB::statement('DROP INDEX IF EXISTS friend_requests_to_status_idx');
        DB::statement('DROP INDEX IF EXISTS follow_requests_target_status_idx');
    }
};
