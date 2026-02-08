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
            if (! Schema::hasColumn('messages', 'deleted_for_sender_at')) {
                $table->timestamp('deleted_for_sender_at')->nullable()->index();
            }
            if (! Schema::hasColumn('messages', 'deleted_for_recipient_at')) {
                $table->timestamp('deleted_for_recipient_at')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'deleted_for_sender_at')) {
                $table->dropColumn('deleted_for_sender_at');
            }
            if (Schema::hasColumn('messages', 'deleted_for_recipient_at')) {
                $table->dropColumn('deleted_for_recipient_at');
            }
        });
    }
};
