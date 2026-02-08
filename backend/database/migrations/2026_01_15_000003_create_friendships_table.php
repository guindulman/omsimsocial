<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('friendships')) {
            Schema::create('friendships', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_low_id')->index()->constrained('users')->cascadeOnDelete();
                $table->foreignId('user_high_id')->index()->constrained('users')->cascadeOnDelete();
                $table->timestamp('verified_at')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->unique(['user_low_id', 'user_high_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};
