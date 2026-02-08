<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('body');
            $table->index(['scope', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            $table->dropIndex(['scope', 'expires_at']);
            $table->dropColumn('expires_at');
        });
    }
};
