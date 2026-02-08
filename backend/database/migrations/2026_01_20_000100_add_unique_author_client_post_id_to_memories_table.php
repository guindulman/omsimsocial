<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            WITH ranked AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY author_id, client_post_id
                        ORDER BY id DESC
                    ) AS rn
                FROM memories
                WHERE client_post_id IS NOT NULL
            )
            UPDATE memories
            SET client_post_id = NULL
            FROM ranked
            WHERE memories.id = ranked.id
              AND ranked.rn > 1
        SQL);

        DB::statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS memories_author_client_post_id_unique
             ON memories (author_id, client_post_id)
             WHERE client_post_id IS NOT NULL'
        );

        DB::statement(
            'CREATE INDEX IF NOT EXISTS memories_client_post_id_idx
             ON memories (client_post_id)
             WHERE client_post_id IS NOT NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS memories_author_client_post_id_unique');
        DB::statement('DROP INDEX IF EXISTS memories_client_post_id_idx');
    }
};
