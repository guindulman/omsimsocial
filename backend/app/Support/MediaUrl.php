<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaUrl
{
    public static function normalize(?string $value, Request $request): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $url = trim($value);
        if ($url === '') {
            return null;
        }

        if (preg_match('/^(file|content|data):/i', $url) === 1) {
            return $url;
        }

        $origin = rtrim($request->getSchemeAndHttpHost(), '/');

        if (preg_match('#^(https?://[^/]+)/api(?:/v\d+)?/storage/(.+)$#i', $url, $matches) === 1) {
            return rtrim($matches[1], '/').'/storage/'.$matches[2];
        }

        if (preg_match('#^/api(?:/v\d+)?/storage/(.+)$#i', $url, $matches) === 1) {
            return $origin.'/storage/'.$matches[1];
        }

        if (preg_match('#^api(?:/v\d+)?/storage/(.+)$#i', $url, $matches) === 1) {
            return $origin.'/storage/'.$matches[1];
        }

        if (Str::startsWith($url, '/')) {
            return $origin.$url;
        }

        if (Str::startsWith($url, 'storage/')) {
            return $origin.'/'.$url;
        }

        if (preg_match('#^http://([^/]+)(/.*)?$#i', $url, $matches) === 1 && $request->isSecure()) {
            $currentHost = strtolower($request->getHttpHost());
            $urlHost = strtolower($matches[1]);
            if ($currentHost === $urlHost) {
                $suffix = $matches[2] ?? '';
                return 'https://'.$urlHost.$suffix;
            }
        }

        return $url;
    }
}
