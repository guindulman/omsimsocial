<?php

namespace App\Services\Moderation;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ImageModerationService
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

    public function __construct(
        private readonly GoogleVisionSafeSearch $googleVision,
    ) {}

    public function enabled(): bool
    {
        return (bool) config('moderation.enabled', false);
    }

    /**
     * @return array{allowed: bool, code?: string, message?: string, provider?: string, annotation?: array<string, string>|null}
     */
    public function moderate(UploadedFile $file): array
    {
        if (! $this->enabled()) {
            return ['allowed' => true];
        }

        $maxBytes = (int) config('moderation.max_image_bytes', 10 * 1024 * 1024);
        if ($maxBytes > 0 && $file->getSize() !== false && $file->getSize() > $maxBytes) {
            return [
                'allowed' => false,
                'code' => 'file_too_large',
                'message' => 'Image is too large to upload.',
            ];
        }

        $provider = (string) config('moderation.provider', 'google_vision');
        if ($provider !== 'google_vision') {
            $failClosed = (bool) config('moderation.fail_closed', true);
            return $failClosed
                ? [
                    'allowed' => false,
                    'code' => 'moderation_not_configured',
                    'message' => 'Moderation is enabled but not configured.',
                ]
                : ['allowed' => true];
        }

        try {
            $result = $this->googleVision->detect($file);
        } catch (\Throwable $e) {
            report($e);

            $failClosed = (bool) config('moderation.fail_closed', true);
            return $failClosed
                ? [
                    'allowed' => false,
                    'code' => 'moderation_unavailable',
                    'message' => 'Moderation service is unavailable. Please try again.',
                ]
                : ['allowed' => true];
        }

        $annotation = $result['annotation'] ?? null;
        if (! is_array($annotation)) {
            return ['allowed' => true, 'provider' => 'google_vision', 'annotation' => null];
        }

        $adult = GoogleVisionSafeSearch::likelihoodScore($annotation['adult'] ?? null);
        $racy = GoogleVisionSafeSearch::likelihoodScore($annotation['racy'] ?? null);
        $violence = GoogleVisionSafeSearch::likelihoodScore($annotation['violence'] ?? null);

        $threshold = $this->thresholdScore((string) config('moderation.block_threshold', 'LIKELY'));

        // Block high-confidence explicit content. Include violence as a safeguard.
        $shouldBlock = $adult >= $threshold || $racy >= $threshold || $violence >= $threshold;
        if ($shouldBlock) {
            return [
                'allowed' => false,
                'code' => 'explicit_content_blocked',
                'message' => 'This image appears to contain explicit content and cannot be uploaded.',
                'provider' => 'google_vision',
                'annotation' => $annotation,
            ];
        }

        return [
            'allowed' => true,
            'provider' => 'google_vision',
            'annotation' => $annotation,
        ];
    }

    private function thresholdScore(string $value): int
    {
        $value = strtoupper(Str::of($value)->trim()->toString());
        return self::LIKELIHOOD_SCORES[$value] ?? self::LIKELIHOOD_SCORES['LIKELY'];
    }
}
