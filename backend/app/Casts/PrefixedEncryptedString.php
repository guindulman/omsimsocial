<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Encrypts string values at rest in the DB, while remaining backward-compatible
 * with legacy plaintext rows.
 *
 * Stored format: "enc:" . Crypt::encryptString($plaintext)
 */
class PrefixedEncryptedString implements CastsAttributes
{
    public const PREFIX = 'enc:';

    private static function looksLikeLaravelEncryptedPayload(string $payload): bool
    {
        $decoded = base64_decode($payload, true);
        if ($decoded === false) {
            return false;
        }

        $json = json_decode($decoded, true);
        if (! is_array($json)) {
            return false;
        }

        // Laravel's encrypted payload is base64(JSON) with at least these keys.
        if (! isset($json['iv'], $json['value'])) {
            return false;
        }

        if (! is_string($json['iv']) || ! is_string($json['value'])) {
            return false;
        }

        return true;
    }

    public function get($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            // Should not happen for TEXT/VARCHAR columns, but keep it safe.
            return (string) $value;
        }

        if (! str_starts_with($value, self::PREFIX)) {
            // Legacy plaintext value (or intentionally unencrypted).
            return $value;
        }

        $payload = substr($value, strlen(self::PREFIX));
        if (! self::looksLikeLaravelEncryptedPayload($payload)) {
            // Plaintext that happens to start with the prefix.
            return $value;
        }

        try {
            return Crypt::decryptString($payload);
        } catch (\Throwable $e) {
            Log::warning('Failed to decrypt encrypted attribute.', [
                'model' => get_class($model),
                'key' => $key,
                'id' => method_exists($model, 'getKey') ? $model->getKey() : null,
                'error' => $e->getMessage(),
            ]);

            // Avoid leaking ciphertext to clients and avoid 500s on corrupted data.
            return '';
        }
    }

    public function set($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            $value = (string) $value;
        }

        return self::PREFIX.Crypt::encryptString($value);
    }
}
