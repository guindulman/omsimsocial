<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            if (! Schema::hasColumn('memories', 'comments_count_cached')) {
                $table->unsignedInteger('comments_count_cached')->default(0);
            }
            if (! Schema::hasColumn('memories', 'hearts_count_cached')) {
                $table->unsignedInteger('hearts_count_cached')->default(0);
            }
            if (! Schema::hasColumn('memories', 'saves_count_cached')) {
                $table->unsignedInteger('saves_count_cached')->default(0);
            }
            if (! Schema::hasColumn('memories', 'reshares_count_cached')) {
                $table->unsignedInteger('reshares_count_cached')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            if (Schema::hasColumn('memories', 'comments_count_cached')) {
                $table->dropColumn('comments_count_cached');
            }
            if (Schema::hasColumn('memories', 'hearts_count_cached')) {
                $table->dropColumn('hearts_count_cached');
            }
            if (Schema::hasColumn('memories', 'saves_count_cached')) {
                $table->dropColumn('saves_count_cached');
            }
            if (Schema::hasColumn('memories', 'reshares_count_cached')) {
                $table->dropColumn('reshares_count_cached');
            }
        });
    }
};
