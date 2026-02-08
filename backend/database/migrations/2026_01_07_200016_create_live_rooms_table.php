<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->enum('visibility', ['connections', 'invite', 'public'])->default('connections');
            $table->enum('status', ['live', 'ended'])->default('live');
            $table->string('provider_stream_id')->nullable();
            $table->string('invite_token_hash')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_rooms');
    }
};
