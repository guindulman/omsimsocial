<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'is_private') && ! Schema::hasIndex('users', 'users_is_private_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('is_private');
            });
        }

        if (Schema::hasColumn('users', 'is_active') && ! Schema::hasIndex('users', 'users_is_active_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('is_active');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', 'users_is_private_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['is_private']);
            });
        }

        if (Schema::hasIndex('users', 'users_is_active_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['is_active']);
            });
        }
    }
};
