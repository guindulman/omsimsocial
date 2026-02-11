<?php

namespace Tests\Feature;

use App\Mail\DataDeletionRequestSubmitted;
use App\Models\DataDeletionRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DataDeletionRequestTest extends TestCase
{
    use RefreshDatabase;

    private function antiSpamFields(): array
    {
        $issuedAt = now()->subSeconds(5)->timestamp;

        return [
            '_issued_at' => $issuedAt,
            '_sig' => hash_hmac('sha256', 'data-deletion|'.$issuedAt, (string) config('app.key')),
        ];
    }

    public function test_data_deletion_page_is_public(): void
    {
        $response = $this->get('/data-deletion');

        $response->assertOk();
        $response->assertSee('Omsim Social &mdash; Data Deletion Request', false);
        $response->assertSee('mailer@omsimsocial.com', false);
    }

    public function test_data_deletion_submit_requires_email_or_username(): void
    {
        Mail::fake();

        $response = $this->post('/data-deletion', [
            'full_name' => 'Test User',
            'request_types' => ['account'],
            'details' => 'Please delete my data.',
            'website' => '',
        ] + $this->antiSpamFields());

        $response->assertSessionHasErrors(['email', 'username']);
        Mail::assertNothingSent();
        $this->assertDatabaseCount('data_deletion_requests', 0);
    }

    public function test_data_deletion_submit_stores_and_sends_email(): void
    {
        Mail::fake();

        $response = $this->post('/data-deletion', [
            'full_name' => 'Test User',
            'email' => 'tester@example.com',
            'request_types' => ['profile', 'messages'],
            'details' => 'Please delete my profile and messages.',
            'website' => '',
        ] + $this->antiSpamFields());

        $response->assertRedirect('/data-deletion');
        $response->assertSessionHas('data_deletion_message');

        $this->assertDatabaseHas('data_deletion_requests', [
            'email' => 'tester@example.com',
            'status' => 'new',
        ]);

        Mail::assertSent(DataDeletionRequestSubmitted::class);
    }

    public function test_data_deletion_submit_rejects_honeypot(): void
    {
        Mail::fake();

        $response = $this->post('/data-deletion', [
            'email' => 'tester@example.com',
            'request_types' => ['account'],
            'website' => 'https://spam.example.com',
        ] + $this->antiSpamFields());

        $response->assertRedirect('/data-deletion');
        $response->assertSessionHas('data_deletion_message');
        Mail::assertNothingSent();
        $this->assertDatabaseCount('data_deletion_requests', 0);
    }

    public function test_data_deletion_submit_requires_valid_form_guard(): void
    {
        Mail::fake();

        $response = $this->post('/data-deletion', [
            'email' => 'tester@example.com',
            'request_types' => ['account'],
            'website' => '',
            '_issued_at' => now()->subSeconds(5)->timestamp,
            '_sig' => 'invalid',
        ]);

        $response->assertSessionHasErrors(['form']);
        Mail::assertNothingSent();
        $this->assertDatabaseCount('data_deletion_requests', 0);
    }
}
