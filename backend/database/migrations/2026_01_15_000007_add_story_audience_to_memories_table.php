<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('memories', 'story_audience')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->enum('story_audience', ['public', 'followers', 'friends', 'circle'])->nullable()->after('body');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('memories', 'story_audience')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->dropColumn('story_audience');
            });
        }
    }
};
