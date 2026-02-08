<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('memories', 'client_post_id')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->string('client_post_id', 64)->nullable()->after('location')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('memories', 'client_post_id')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->dropIndex(['client_post_id']);
                $table->dropColumn('client_post_id');
            });
        }
    }
};
