<?php

namespace Tests\Feature;

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
}
