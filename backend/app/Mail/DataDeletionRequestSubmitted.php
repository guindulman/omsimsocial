<?php

namespace App\Mail;

use App\Models\DataDeletionRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DataDeletionRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public DataDeletionRequest $dataDeletionRequest) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('privacy.app_name', 'Omsim Social');

        return new Envelope(
            subject: "[{$appName}] Data Deletion Request (#{$this->dataDeletionRequest->id})"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.data-deletion-request-submitted',
            with: [
                'request' => $this->dataDeletionRequest,
                'appName' => (string) config('privacy.app_name', 'Omsim Social'),
            ]
        );
    }
}

