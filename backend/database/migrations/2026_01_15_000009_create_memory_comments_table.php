<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('memory_comments')) {
            Schema::create('memory_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('memory_id')->index()->constrained('memories')->cascadeOnDelete();
                $table->foreignId('user_id')->index()->constrained('users')->cascadeOnDelete();
                $table->text('body');
                $table->timestamps();

                $table->index(['memory_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('memory_comments');
    }
};
