<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS requests
        if ($request->getMethod() === 'OPTIONS') {
            return $this->handlePreflightRequest($request);
        }

        $response = $next($request);

        return $this->addCorsHeaders($request, $response);
    }

    /**
     * Handle preflight OPTIONS request.
     */
    protected function handlePreflightRequest(Request $request): Response
    {
        $response = response('', 204); // Use 204 No Content for OPTIONS
        return $this->addCorsHeaders($request, $response);
    }

    /**
     * Add CORS headers to the response.
     */
    protected function addCorsHeaders(Request $request, Response $response): Response
    {
        $origin = $request->headers->get('Origin');

        // Only add CORS headers if there's an Origin header
        if ($origin) {
            // Get allowed origins from config
            $allowedOrigins = $this->getAllowedOrigins();

            // Check if origin is allowed
            if ($this->isOriginAllowed($origin, $allowedOrigins)) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
            } elseif (in_array('*', $allowedOrigins)) {
                $response->headers->set('Access-Control-Allow-Origin', '*');
            }

            // Set other CORS headers only when Origin is present
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', [
                'Accept',
                'Authorization',
                'Content-Type',
                'X-Requested-With',
                'X-CSRF-TOKEN',
                'X-XSRF-TOKEN',
                'Origin',
                'Cache-Control',
                'Pragma',
            ]));

            $response->headers->set('Access-Control-Expose-Headers', implode(', ', [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'X-Total-Count',
                'X-Current-Page',
                'X-Per-Page',
            ]));

            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', config('cors.max_age', 86400));
        }

        return $response;
    }

    /**
     * Get allowed origins from configuration.
     */
    protected function getAllowedOrigins(): array
    {
        if (app()->environment('production')) {
            $origins = config('cors.allowed_origins', []);
            if (empty($origins)) {
                // Fallback to environment variable
                $envOrigins = env('CORS_ALLOWED_ORIGINS', '');
                return $envOrigins ? explode(',', $envOrigins) : [];
            }
            return $origins;
        }

        // In development, allow all origins
        return ['*'];
    }

    /**
     * Check if the origin is allowed.
     */
    protected function isOriginAllowed(?string $origin, array $allowedOrigins): bool
    {
        if (!$origin) {
            return false;
        }

        // Check exact matches
        if (in_array($origin, $allowedOrigins)) {
            return true;
        }

        // Check patterns
        $patterns = config('cors.allowed_origins_patterns', []);
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $origin)) {
                return true;
            }
        }

        return false;
    }
}
