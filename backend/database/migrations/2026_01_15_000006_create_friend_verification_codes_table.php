<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('friend_verification_codes')) {
            Schema::create('friend_verification_codes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->index()->constrained('users')->cascadeOnDelete();
                $table->string('code')->unique();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('friend_verification_codes');
    }
};
