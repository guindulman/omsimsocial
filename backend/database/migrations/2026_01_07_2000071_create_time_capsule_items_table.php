<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_capsule_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('time_capsule_id')->constrained('time_capsules')->cascadeOnDelete();
            $table->foreignId('memory_id')->constrained('memories')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['time_capsule_id', 'memory_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_capsule_items');
    }
};
