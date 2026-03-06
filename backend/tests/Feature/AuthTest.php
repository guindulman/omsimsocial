<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Password;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_and_logout(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'tester@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $register->assertCreated()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'username', 'email'],
                'token',
            ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'tester@example.com',
            'password' => 'password123',
        ]);

        $login->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'username', 'email'],
                'token',
            ]);

        $token = $login->json('token');
        $logout = $this->withHeaders(['Authorization' => 'Bearer '.$token])
            ->postJson('/api/v1/auth/logout');

        $logout->assertOk();
    }

    public function test_forgot_password_gracefully_handles_mail_failures(): void
    {
        Password::shouldReceive('sendResetLink')
            ->once()
            ->andThrow(new \RuntimeException('SMTP unavailable'));

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertOk()
            ->assertJson([
                'code' => 'password_reset_sent',
            ]);
    }

    public function test_reset_password_gracefully_handles_broker_failures(): void
    {
        Password::shouldReceive('reset')
            ->once()
            ->andThrow(new \RuntimeException('Broker failure'));

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'sample-token',
            'email' => 'nobody@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'code' => 'password_reset_failed',
            ]);
    }
}
