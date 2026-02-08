<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE memories SET scope = 'friends' WHERE scope = 'connections'");

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_scope_check');
            DB::statement("ALTER TABLE memories ADD CONSTRAINT memories_scope_check CHECK (scope IN ('circle', 'direct', 'private', 'public', 'followers', 'friends', 'story'))");
        } else {
            DB::statement("ALTER TABLE memories MODIFY COLUMN scope ENUM('circle', 'direct', 'private', 'public', 'followers', 'friends', 'story') NOT NULL");
        }
    }

    public function down(): void
    {
        DB::statement("UPDATE memories SET scope = 'connections' WHERE scope IN ('followers', 'friends')");

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_scope_check');
            DB::statement("ALTER TABLE memories ADD CONSTRAINT memories_scope_check CHECK (scope IN ('circle', 'direct', 'private', 'public', 'connections', 'story'))");
        } else {
            DB::statement("ALTER TABLE memories MODIFY COLUMN scope ENUM('circle', 'direct', 'private', 'public', 'connections', 'story') NOT NULL");
        }
    }
};
