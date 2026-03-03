<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
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
                'refresh_token',
            ]);

        $token = $login->json('token');
        $logout = $this->withHeaders(['Authorization' => 'Bearer '.$token])
            ->postJson('/api/v1/auth/logout');

        $logout->assertOk();
    }

    public function test_register_requires_email(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'username' => 'testuser-no-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $register->assertStatus(422)
            ->assertJsonPath('code', 'validation_failed')
            ->assertJsonPath('message', 'The email field is required.');
    }

    public function test_refresh_token_rotates_and_old_refresh_token_is_invalid(): void
    {
        $user = User::factory()->create([
            'password' => 'password123',
            'email' => 'refresh@example.com',
            'username' => 'refreshuser',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'refresh@example.com',
            'password' => 'password123',
            'remember_me' => true,
        ]);

        $login->assertOk()
            ->assertJsonStructure([
                'token',
                'access_token',
                'refresh_token',
                'token_expires_at',
                'refresh_token_expires_at',
            ]);

        $oldRefreshToken = (string) $login->json('refresh_token');
        $refresh = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefreshToken,
        ]);

        $refresh->assertOk()
            ->assertJsonStructure([
                'token',
                'access_token',
                'refresh_token',
            ]);

        $newRefreshToken = (string) $refresh->json('refresh_token');
        $this->assertNotSame($oldRefreshToken, $newRefreshToken);

        $reuse = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefreshToken,
        ]);

        $reuse->assertStatus(401)
            ->assertJsonPath('code', 'invalid_refresh_token');
    }

    public function test_forgot_and_reset_password_flow(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => 'old-password',
        ]);

        $forgot = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'reset@example.com',
        ]);
        $forgot->assertOk()
            ->assertJsonPath('code', 'password_reset_sent');

        $token = Password::broker()->createToken($user);
        $reset = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset@example.com',
            'token' => $token,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);
        $reset->assertOk()
            ->assertJsonPath('code', 'password_reset_success');

        $oldLogin = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'reset@example.com',
            'password' => 'old-password',
        ]);
        $oldLogin->assertStatus(401);

        $newLogin = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'reset@example.com',
            'password' => 'new-password-123',
        ]);
        $newLogin->assertOk()
            ->assertJsonStructure(['token', 'refresh_token']);
    }

    public function test_resend_verification_returns_success_for_already_verified_user(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/auth/email/verification-notification');
        $response->assertOk()
            ->assertJsonPath('code', 'email_already_verified')
            ->assertJsonPath('already_verified', true);
    }
}
