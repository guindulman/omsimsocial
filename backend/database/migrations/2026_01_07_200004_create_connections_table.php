<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('addressee_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'blocked'])->default('pending');
            $table->enum('method', ['handshake', 'invite', 'event'])->default('invite');
            $table->enum('type', ['friend', 'family', 'work', 'community'])->default('friend');
            $table->enum('level', ['acquaintance', 'friend', 'inner'])->default('acquaintance');
            $table->string('invite_code')->nullable()->unique();
            $table->timestamp('muted_at')->nullable();
            $table->timestamps();

            $table->unique(['requester_id', 'addressee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connections');
    }
};
