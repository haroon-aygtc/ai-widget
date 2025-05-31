<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsTest extends TestCase
{
    /**
     * Test CORS headers are present on API requests.
     */
    public function test_cors_headers_present_on_api_requests(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->get('/api/ai-providers/available');

        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    /**
     * Test CORS preflight OPTIONS request.
     */
    public function test_cors_preflight_options_request(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ])->options('/api/ai-providers');

        $response->assertStatus(204); // OPTIONS should return 204
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->assertHeader('Access-Control-Allow-Methods');
        $response->assertHeader('Access-Control-Allow-Headers');
        $response->assertHeader('Access-Control-Max-Age');
    }

    /**
     * Test CORS allows all origins in development.
     */
    public function test_cors_allows_all_origins_in_development(): void
    {
        // Ensure we're in testing environment (which should behave like development)
        $this->app['env'] = 'testing';

        $response = $this->withHeaders([
            'Origin' => 'http://example.com',
        ])->get('/api/ai-providers/available');

        // Should allow the origin even if not in allowed list
        $response->assertHeader('Access-Control-Allow-Origin', 'http://example.com');
    }

    /**
     * Test CORS exposes rate limit headers.
     */
    public function test_cors_exposes_rate_limit_headers(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->get('/api/ai-providers/available');

        $exposedHeaders = $response->headers->get('Access-Control-Expose-Headers');

        $this->assertStringContainsString('X-RateLimit-Limit', $exposedHeaders);
        $this->assertStringContainsString('X-RateLimit-Remaining', $exposedHeaders);
        $this->assertStringContainsString('X-RateLimit-Reset', $exposedHeaders);
    }

    /**
     * Test CORS works with widget endpoints.
     */
    public function test_cors_works_with_widget_endpoints(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://example.com',
        ])->get('/widget/test-embed-code');

        // Should have CORS headers even for widget endpoints
        $response->assertHeader('Access-Control-Allow-Origin');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    /**
     * Test CORS handles requests without origin header.
     */
    public function test_cors_handles_requests_without_origin(): void
    {
        $response = $this->get('/api/ai-providers/available');

        // Should not set Access-Control-Allow-Origin for requests without Origin header
        $response->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    /**
     * Test CORS middleware allows required headers.
     */
    public function test_cors_allows_required_headers(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->options('/api/ai-providers');

        $allowedHeaders = $response->headers->get('Access-Control-Allow-Headers');

        $this->assertNotNull($allowedHeaders, 'Access-Control-Allow-Headers should be present');

        $requiredHeaders = [
            'Accept',
            'Authorization',
            'Content-Type',
            'X-Requested-With',
            'X-CSRF-TOKEN',
        ];

        foreach ($requiredHeaders as $header) {
            $this->assertStringContainsString($header, $allowedHeaders);
        }
    }

    /**
     * Test CORS allows required methods.
     */
    public function test_cors_allows_required_methods(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->options('/api/ai-providers');

        $allowedMethods = $response->headers->get('Access-Control-Allow-Methods');

        $this->assertNotNull($allowedMethods, 'Access-Control-Allow-Methods should be present');

        $requiredMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

        foreach ($requiredMethods as $method) {
            $this->assertStringContainsString($method, $allowedMethods);
        }
    }
}
