<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adoptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_id')->constrained('memories')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->enum('visibility', ['private', 'shared'])->default('private');
            $table->timestamps();

            $table->unique(['memory_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adoptions');
    }
};
