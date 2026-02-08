<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('caption')->nullable();
            $table->enum('status', ['vip', 'public', 'gem', 'expired'])->default('vip');
            $table->enum('visibility_scope', ['public', 'connections', 'nearby', 'event'])->default('public');
            $table->timestamp('vip_until')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('adopted_count')->default(0);
            $table->unsignedInteger('clarify_count')->default(0);
            $table->timestamps();

            $table->index(['expires_at']);
            $table->index(['status']);
            $table->index(['user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
