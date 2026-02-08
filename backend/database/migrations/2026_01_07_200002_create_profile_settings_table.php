<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary();
            $table->enum('profile_visibility', ['public', 'connections'])->default('public');
            $table->boolean('share_profile_views')->default(false);
            $table->boolean('show_city')->default(true);
            $table->boolean('show_links')->default(true);
            $table->enum('allow_invites_from', ['everyone', 'mutuals', 'nobody'])->default('everyone');
            $table->enum('allow_calls_from', ['connections', 'favorites', 'nobody'])->default('connections');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_settings');
    }
};
