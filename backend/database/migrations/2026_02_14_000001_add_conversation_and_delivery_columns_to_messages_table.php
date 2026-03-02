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
            if (! Schema::hasColumn('messages', 'conversation_id')) {
                $table->foreignId('conversation_id')
                    ->nullable()
                    ->after('recipient_id')
                    ->constrained('conversations')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('messages', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('read_at')->index();
            }
        });

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'conversation_id')) {
                $table->index(['conversation_id', 'created_at'], 'messages_conversation_created_idx');
            }

            $table->index(['sender_id', 'recipient_id', 'id'], 'messages_pair_id_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            try {
                $table->dropIndex('messages_conversation_created_idx');
            } catch (\Throwable $e) {
                // Ignore if index does not exist.
            }

            try {
                $table->dropIndex('messages_pair_id_idx');
            } catch (\Throwable $e) {
                // Ignore if index does not exist.
            }
        });

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'conversation_id')) {
                $table->dropConstrainedForeignId('conversation_id');
            }

            if (Schema::hasColumn('messages', 'delivered_at')) {
                $table->dropColumn('delivered_at');
            }
        });
    }
};
