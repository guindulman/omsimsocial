<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connections', function (Blueprint $table) {
            $table->unsignedBigInteger('user_low_id')->nullable()->after('id');
            $table->unsignedBigInteger('user_high_id')->nullable()->after('user_low_id');
            $table->timestamp('verified_at')->nullable()->after('user_high_id');

            $table->index('user_low_id');
            $table->index('user_high_id');
        });

        DB::statement('UPDATE connections SET user_low_id = LEAST(requester_id, addressee_id), user_high_id = GREATEST(requester_id, addressee_id) WHERE requester_id IS NOT NULL AND addressee_id IS NOT NULL');

        Schema::table('connections', function (Blueprint $table) {
            $table->foreign('user_low_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('user_high_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_low_id', 'user_high_id']);
        });
    }

    public function down(): void
    {
        Schema::table('connections', function (Blueprint $table) {
            $table->dropUnique(['user_low_id', 'user_high_id']);
            $table->dropForeign(['user_low_id']);
            $table->dropForeign(['user_high_id']);
            $table->dropIndex(['user_low_id']);
            $table->dropIndex(['user_high_id']);
            $table->dropColumn(['user_low_id', 'user_high_id', 'verified_at']);
        });
    }
};
