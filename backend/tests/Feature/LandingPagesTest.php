<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPagesTest extends TestCase
{
    use RefreshDatabase;

    private function contactAntiSpamFields(): array
    {
        $issuedAt = now()->subSeconds(5)->timestamp;

        return [
            '_issued_at' => $issuedAt,
            '_sig' => hash_hmac('sha256', 'contact|'.$issuedAt, (string) config('app.key')),
        ];
    }

    public function test_public_pages_load(): void
    {
        $this->get('/')->assertOk()->assertSee('Real Friends. Less Noise.');
        $this->get('/terms')->assertOk();
        $this->get('/privacy')->assertOk();
        $this->get('/contact')->assertOk();
    }

    public function test_contact_submission_redirects_with_success(): void
    {
        $this->post('/contact', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'message' => 'Hello from the contact form.',
        ] + $this->contactAntiSpamFields())
            ->assertRedirect(route('contact.show'))
            ->assertSessionHas('contact_message');
    }
}
