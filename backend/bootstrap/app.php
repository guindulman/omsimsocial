<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Typical production deployments run behind a reverse proxy (Nginx/Caddy/Traefik).
        // Trust forwarded headers so HTTPS + client IP (rate limiting) work correctly.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
        );

        $middleware->statefulApi();
        $middleware->throttleApi();

        $middleware->alias([
            'block.check' => \App\Http\Middleware\EnsureNotBlocked::class,
            'active' => \App\Http\Middleware\EnsureActiveUser::class,
            'admin' => \App\Http\Middleware\AdminAuthenticated::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\EnsureNotBlocked::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'code' => 'unauthenticated',
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        $exceptions->render(function (ValidationException $exception, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'code' => 'validation_error',
                    'message' => $exception->getMessage(),
                    'errors' => $exception->errors(),
                ], $exception->status);
            }
        });
    })
    ->withCommands()
    ->create();
