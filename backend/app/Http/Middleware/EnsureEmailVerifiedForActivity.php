<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailVerifiedForActivity
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'code' => 'email_unverified',
                'message' => 'Please verify your email before posting or messaging.',
            ], 403);
        }

        return $next($request);
    }
}

