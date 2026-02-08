<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->enum('scope', ['circle', 'direct', 'private']);
            $table->foreignId('circle_id')->nullable()->constrained('circles')->cascadeOnDelete();
            $table->foreignId('direct_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->text('body')->nullable();
            $table->timestamps();

            $table->index(['scope', 'circle_id']);
            $table->index(['scope', 'direct_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memories');
    }
};
