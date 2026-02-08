<?php

return [
    'name' => env('ADMIN_NAME', 'Omsim Admin'),
    'email' => env('ADMIN_EMAIL', 'admin@omsim.local'),
    'password' => env('ADMIN_PASSWORD', ''),
    'note_templates' => [
        [
            'key' => 'spam',
            'label' => 'Spam or scam',
            'body' => 'Flagged for spam or suspicious outreach. Review links and message patterns.',
        ],
        [
            'key' => 'harassment',
            'label' => 'Harassment',
            'body' => 'Reported for harassment or abusive language. Apply warning or suspension if repeated.',
        ],
        [
            'key' => 'impersonation',
            'label' => 'Impersonation',
            'body' => 'Possible impersonation. Verify identity and remove misleading profile data.',
        ],
        [
            'key' => 'safety',
            'label' => 'Safety risk',
            'body' => 'Potential safety concern. Escalate if there is threat or self-harm risk.',
        ],
        [
            'key' => 'content',
            'label' => 'Inappropriate content',
            'body' => 'Content may violate community guidelines. Remove or restrict as needed.',
        ],
        [
            'key' => 'other',
            'label' => 'Other',
            'body' => 'Manual review required. Add details in the note below.',
        ],
    ],
];
