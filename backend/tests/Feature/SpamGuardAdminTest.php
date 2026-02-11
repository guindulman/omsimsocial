<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpamGuardAdminTest extends TestCase
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

    public function test_spam_guard_page_requires_admin_session(): void
    {
        $this->get('/admin/spam-guard')
            ->assertRedirect(route('admin.login'));
    }

    public function test_contact_honeypot_attempt_is_logged(): void
    {
        $this->post('/contact', [
            'name' => 'Spam Bot',
            'email' => 'spam@example.com',
            'message' => 'buy now',
            'company' => 'bot value',
        ] + $this->contactAntiSpamFields())
            ->assertRedirect(route('contact.show'));

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'spam.blocked.contact.honeypot',
            'target_type' => 'spam_guard',
        ]);
    }

    public function test_admin_can_view_spam_guard_logs(): void
    {
        AdminAuditLog::query()->create([
            'actor' => 'system:spam-guard',
            'action' => 'spam.blocked.contact.honeypot',
            'target_type' => 'spam_guard',
            'metadata' => ['ip' => '127.0.0.1', 'surface' => 'contact', 'reason' => 'honeypot'],
            'created_at' => now(),
        ]);

        $this->withSession([
            'admin_authenticated' => true,
            'admin_email' => 'admin@example.com',
        ])->get('/admin/spam-guard')
            ->assertOk()
            ->assertSee('Spam guard')
            ->assertSee('Honeypot');
    }
}
