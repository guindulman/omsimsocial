<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('inbox_events')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        $types = "'adoption_note', 'memory_saved', 'memory_liked', 'memory_commented', 'comment_liked', 'memory_reshared', 'connection_request', 'system'";

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE inbox_events DROP CONSTRAINT IF EXISTS inbox_events_type_check');
            DB::statement("ALTER TABLE inbox_events ADD CONSTRAINT inbox_events_type_check CHECK (type IN ({$types}))");
        } elseif ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE inbox_events MODIFY COLUMN type ENUM({$types}) NOT NULL"
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('inbox_events')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        $types = "'adoption_note', 'memory_saved', 'connection_request', 'system'";

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE inbox_events DROP CONSTRAINT IF EXISTS inbox_events_type_check');
            DB::statement("ALTER TABLE inbox_events ADD CONSTRAINT inbox_events_type_check CHECK (type IN ({$types}))");
        } elseif ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE inbox_events MODIFY COLUMN type ENUM({$types}) NOT NULL"
            );
        }
    }
};
