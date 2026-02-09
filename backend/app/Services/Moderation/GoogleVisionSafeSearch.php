<?php

namespace App\Services\Moderation;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class GoogleVisionSafeSearch
{
    /** @var array<string, int> */
    private const LIKELIHOOD_SCORES = [
        'UNKNOWN' => 0,
        'VERY_UNLIKELY' => 1,
        'UNLIKELY' => 2,
        'POSSIBLE' => 3,
        'LIKELY' => 4,
        'VERY_LIKELY' => 5,
    ];

    /**
     * @return array{annotation: array<string, string>|null, raw: mixed}
     */
    public function detect(UploadedFile $file): array
    {
        $apiKey = config('moderation.google_vision_api_key');
        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw new \RuntimeException('Google Vision API key is not configured.');
        }

        $path = $file->getRealPath();
        if (! is_string($path) || $path === '' || ! is_file($path)) {
            throw new \RuntimeException('Could not read uploaded file for moderation.');
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new \RuntimeException('Could not read uploaded file for moderation.');
        }

        $payload = [
            'requests' => [
                [
                    'image' => [
                        'content' => base64_encode($contents),
                    ],
                    'features' => [
                        [
                            'type' => 'SAFE_SEARCH_DETECTION',
                        ],
                    ],
                ],
            ],
        ];

        $timeout = (int) config('moderation.timeout', 3);

        $response = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post("https://vision.googleapis.com/v1/images:annotate?key={$apiKey}", $payload);

        $response->throw();

        $raw = $response->json();
        $annotation = data_get($raw, 'responses.0.safeSearchAnnotation');
        if (! is_array($annotation)) {
            $annotation = null;
        }

        return [
            'annotation' => $annotation,
            'raw' => $raw,
        ];
    }

    public static function likelihoodScore(?string $value): int
    {
        if (! is_string($value)) {
            return self::LIKELIHOOD_SCORES['UNKNOWN'];
        }

        $value = strtoupper(trim($value));
        return self::LIKELIHOOD_SCORES[$value] ?? self::LIKELIHOOD_SCORES['UNKNOWN'];
    }
}

