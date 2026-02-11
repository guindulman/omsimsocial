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
        ]);

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
        ]);

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
        ]);

        $response->assertSessionHasErrors(['website']);
        Mail::assertNothingSent();
        $this->assertDatabaseCount('data_deletion_requests', 0);
    }
}

