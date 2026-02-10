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
            if (! Schema::hasColumn('messages', 'body_e2ee_version')) {
                $table->unsignedSmallInteger('body_e2ee_version')->nullable()->after('body');
            }
            if (! Schema::hasColumn('messages', 'body_e2ee_sender_public_key')) {
                $table->string('body_e2ee_sender_public_key', 255)->nullable()->after('body_e2ee_version');
            }
            if (! Schema::hasColumn('messages', 'body_ciphertext_sender')) {
                $table->text('body_ciphertext_sender')->nullable()->after('body_e2ee_sender_public_key');
            }
            if (! Schema::hasColumn('messages', 'body_nonce_sender')) {
                $table->string('body_nonce_sender', 255)->nullable()->after('body_ciphertext_sender');
            }
            if (! Schema::hasColumn('messages', 'body_ciphertext_recipient')) {
                $table->text('body_ciphertext_recipient')->nullable()->after('body_nonce_sender');
            }
            if (! Schema::hasColumn('messages', 'body_nonce_recipient')) {
                $table->string('body_nonce_recipient', 255)->nullable()->after('body_ciphertext_recipient');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'body_e2ee_version')) {
                $table->dropColumn('body_e2ee_version');
            }
            if (Schema::hasColumn('messages', 'body_e2ee_sender_public_key')) {
                $table->dropColumn('body_e2ee_sender_public_key');
            }
            if (Schema::hasColumn('messages', 'body_ciphertext_sender')) {
                $table->dropColumn('body_ciphertext_sender');
            }
            if (Schema::hasColumn('messages', 'body_nonce_sender')) {
                $table->dropColumn('body_nonce_sender');
            }
            if (Schema::hasColumn('messages', 'body_ciphertext_recipient')) {
                $table->dropColumn('body_ciphertext_recipient');
            }
            if (Schema::hasColumn('messages', 'body_nonce_recipient')) {
                $table->dropColumn('body_nonce_recipient');
            }
        });
    }
};

