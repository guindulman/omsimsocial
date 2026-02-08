<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('viewed_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('viewer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('viewer_visibility', ['named', 'anonymous'])->default('named');
            $table->enum('source', ['fresh', 'last_call', 'gems', 'search', 'invite', 'nearby', 'profile_link']);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['viewed_user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_views');
    }
};
