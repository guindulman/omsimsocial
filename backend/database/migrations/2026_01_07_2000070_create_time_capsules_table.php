<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_capsules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('unlock_at');
            $table->enum('scope', ['private', 'circle', 'direct'])->default('private');
            $table->foreignId('circle_id')->nullable()->constrained('circles')->cascadeOnDelete();
            $table->foreignId('direct_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_capsules');
    }
};
