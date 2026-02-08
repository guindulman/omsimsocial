<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('circles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->boolean('invite_only')->default(true);
            $table->enum('prompt_frequency', ['off', 'daily', 'weekly'])->default('off');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('circles');
    }
};
