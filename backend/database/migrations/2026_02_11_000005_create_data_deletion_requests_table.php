<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_deletion_requests', function (Blueprint $table) {
            $table->id();
            $table->string('app_name')->default((string) config('privacy.app_name', 'Omsim Social'));
            $table->string('full_name', 120)->nullable();
            $table->string('email')->nullable();
            $table->string('username', 60)->nullable();
            $table->json('request_types');
            $table->text('details')->nullable();
            $table->string('status', 24)->default('new');
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('email');
            $table->index('username');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_deletion_requests');
    }
};

