<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'media_url')) {
                $table->string('media_url')->nullable()->after('body');
            }
            if (! Schema::hasColumn('messages', 'media_type')) {
                $table->string('media_type', 20)->nullable()->after('media_url');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'media_url')) {
                $table->dropColumn('media_url');
            }
            if (Schema::hasColumn('messages', 'media_type')) {
                $table->dropColumn('media_type');
            }
        });
    }
};
