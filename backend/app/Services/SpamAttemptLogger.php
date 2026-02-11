<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class SpamAttemptLogger
{
    public function blocked(string $surface, string $reason, Request $request, array $context = []): void
    {
        $surfaceKey = $this->normalizeKey($surface);
        $reasonKey = $this->normalizeKey($reason);
        $email = strtolower(trim((string) $request->input('email', '')));
        $username = strtolower(trim((string) $request->input('username', '')));

        $metadata = array_merge([
            'surface' => $surfaceKey,
            'reason' => $reasonKey,
            'ip' => (string) ($request->ip() ?: 'unknown'),
            'user_agent' => Str::limit((string) ($request->userAgent() ?: ''), 512, ''),
            'path' => (string) $request->path(),
            'method' => (string) $request->method(),
        ], $context);

        if ($email !== '') {
            $metadata['email_sha256'] = hash('sha256', $email);
        }

        if ($username !== '') {
            $metadata['username_sha256'] = hash('sha256', $username);
        }

        try {
            AdminAuditLog::query()->create([
                'actor' => 'system:spam-guard',
                'action' => "spam.blocked.{$surfaceKey}.{$reasonKey}",
                'target_type' => 'spam_guard',
                'metadata' => $metadata,
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Failed to store spam guard audit log.', [
                'surface' => $surfaceKey,
                'reason' => $reasonKey,
                'exception' => $exception->getMessage(),
            ]);
        }
    }

    private function normalizeKey(string $value): string
    {
        return (string) Str::of($value)
            ->trim()
            ->lower()
            ->replace(['-', ' '], '_')
            ->replaceMatches('/[^a-z0-9_]/', '');
    }
}
