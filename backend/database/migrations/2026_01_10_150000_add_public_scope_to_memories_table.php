<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_scope_check");
            DB::statement("ALTER TABLE memories ADD CONSTRAINT memories_scope_check CHECK (scope IN ('circle', 'direct', 'private', 'public'))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE memories MODIFY COLUMN scope ENUM('circle', 'direct', 'private', 'public') NOT NULL");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_scope_check");
            DB::statement("ALTER TABLE memories ADD CONSTRAINT memories_scope_check CHECK (scope IN ('circle', 'direct', 'private'))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE memories MODIFY COLUMN scope ENUM('circle', 'direct', 'private') NOT NULL");
        }
    }
};
