<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $key = 'api', int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $identifier = $this->resolveRequestSignature($request, $key);

        if (RateLimiter::tooManyAttempts($identifier, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($identifier);

            return response()->json([
                'error' => 'Too many requests. Please try again in ' . $seconds . ' seconds.',
                'retry_after' => $seconds
            ], 429);
        }

        RateLimiter::hit($identifier, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', max(0, $maxAttempts - RateLimiter::attempts($identifier)));
        $response->headers->set('X-RateLimit-Reset', RateLimiter::availableIn($identifier));

        return $response;
    }

    /**
     * Resolve the rate limiting signature for the request.
     */
    protected function resolveRequestSignature(Request $request, string $key): string
    {
        $user = $request->user();

        if ($user) {
            return $key . ':user:' . $user->id;
        }

        return $key . ':ip:' . $request->ip();
    }
}