<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('is_active')
            ->update(['is_active' => true]);

        DB::table('users')
            ->whereNull('is_private')
            ->update(['is_private' => false]);
    }

    public function down(): void
    {
    }
};
