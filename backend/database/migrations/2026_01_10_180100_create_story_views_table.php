<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('story_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_id')->constrained('memories')->cascadeOnDelete();
            $table->foreignId('viewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['memory_id', 'viewer_user_id']);
            $table->index(['memory_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('story_views');
    }
};
