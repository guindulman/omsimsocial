<?php

namespace App\Console\Commands;

use App\Casts\PrefixedEncryptedString;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EncryptLegacyMessages extends Command
{
    protected $signature = 'messages:encrypt-legacy
                            {--dry-run : Only report what would be encrypted}
                            {--chunk=500 : Rows to process per chunk}';

    protected $description = 'Encrypt legacy plaintext chat messages stored in the database.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunk = (int) $this->option('chunk');
        if ($chunk < 1 || $chunk > 5000) {
            $chunk = 500;
        }

        $targets = [
            ['table' => 'messages', 'id' => 'id', 'column' => 'body'],
            ['table' => 'backstage_messages', 'id' => 'id', 'column' => 'message'],
            ['table' => 'live_chat_messages', 'id' => 'id', 'column' => 'message'],
        ];

        foreach ($targets as $target) {
            $table = $target['table'];
            $idCol = $target['id'];
            $col = $target['column'];

            $this->info("== {$table}.{$col} ==");

            $schema = DB::getSchemaBuilder();
            if (! $schema->hasTable($table)) {
                $this->warn('skip: table missing');
                continue;
            }
            if (! $schema->hasColumn($table, $col)) {
                $this->warn('skip: column missing');
                continue;
            }

            $encrypted = 0;
            $skipped = 0;

            DB::table($table)
                ->select([$idCol, $col])
                ->orderBy($idCol)
                ->chunkById($chunk, function ($rows) use ($table, $idCol, $col, $dryRun, &$encrypted, &$skipped) {
                    foreach ($rows as $row) {
                        $raw = $row->{$col};
                        if (! is_string($raw)) {
                            $skipped++;
                            continue;
                        }

                        if (PrefixedEncryptedString::isEncryptedValue($raw)) {
                            $skipped++;
                            continue;
                        }

                        $next = PrefixedEncryptedString::PREFIX.Crypt::encryptString($raw);

                        if (! $dryRun) {
                            DB::table($table)
                                ->where($idCol, $row->{$idCol})
                                ->update([$col => $next]);
                        }

                        $encrypted++;
                    }
                }, $idCol);

            $this->line(($dryRun ? 'would encrypt: ' : 'encrypted: ').$encrypted);
            $this->line('skipped: '.$skipped);
        }

        return Command::SUCCESS;
    }
}

