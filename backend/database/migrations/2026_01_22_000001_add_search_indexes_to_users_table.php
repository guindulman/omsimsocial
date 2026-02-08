<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username))');
        DB::statement('CREATE INDEX IF NOT EXISTS users_name_lower_idx ON users (lower(name))');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS users_username_lower_idx');
        DB::statement('DROP INDEX IF EXISTS users_name_lower_idx');
    }
};
