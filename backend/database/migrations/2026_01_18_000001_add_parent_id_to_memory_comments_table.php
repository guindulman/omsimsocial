<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memory_comments', function (Blueprint $table) {
            if (! Schema::hasColumn('memory_comments', 'parent_id')) {
                $table->foreignId('parent_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('memory_comments')
                    ->cascadeOnDelete();
                $table->index('parent_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('memory_comments', function (Blueprint $table) {
            if (Schema::hasColumn('memory_comments', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropIndex(['parent_id']);
                $table->dropColumn('parent_id');
            }
        });
    }
};
