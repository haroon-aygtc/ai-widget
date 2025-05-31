<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventDemoDataInProduction
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if we're in production and demo data is not explicitly allowed
        if (app()->environment('production') && !env('ALLOW_DEMO_DATA', false)) {
            
            // Check for demo API keys in request
            $this->checkForDemoApiKeys($request);
            
            // Check for demo data patterns in request body
            $this->checkForDemoDataPatterns($request);
        }

        return $next($request);
    }

    /**
     * Check for demo API keys in the request.
     *
     * @param Request $request
     * @throws \Exception
     */
    private function checkForDemoApiKeys(Request $request): void
    {
        $data = $request->all();
        
        // Check for demo API keys
        if (isset($data['api_key']) && str_starts_with($data['api_key'], 'demo-')) {
            abort(403, 'Demo API keys are not allowed in production environment');
        }

        // Check nested data structures
        $this->recursivelyCheckForDemoKeys($data);
    }

    /**
     * Recursively check for demo keys in nested arrays.
     *
     * @param array $data
     * @throws \Exception
     */
    private function recursivelyCheckForDemoKeys(array $data): void
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $this->recursivelyCheckForDemoKeys($value);
            } elseif (is_string($value)) {
                // Check for demo patterns
                if (str_starts_with($value, 'demo-') && str_contains($value, 'key')) {
                    abort(403, 'Demo API keys are not allowed in production environment');
                }
                
                // Check for placeholder emails
                if (str_contains($value, '@example.com') && $key === 'email') {
                    abort(403, 'Demo email addresses are not allowed in production environment');
                }
                
                // Check for test/demo URLs
                if (str_contains($value, 'localhost') || str_contains($value, '127.0.0.1')) {
                    if (in_array($key, ['webhook_url', 'callback_url', 'api_url'])) {
                        abort(403, 'Local URLs are not allowed in production environment');
                    }
                }
            }
        }
    }

    /**
     * Check for demo data patterns in request.
     *
     * @param Request $request
     * @throws \Exception
     */
    private function checkForDemoDataPatterns(Request $request): void
    {
        $content = $request->getContent();
        
        // Check for common demo patterns
        $demoPatterns = [
            'demo-',
            'test-key',
            'example-key',
            'placeholder-',
            'mock-data',
            'fake-',
            'sample-'
        ];

        foreach ($demoPatterns as $pattern) {
            if (str_contains(strtolower($content), $pattern)) {
                // Only block if it's related to sensitive data
                if (str_contains(strtolower($content), 'api') || 
                    str_contains(strtolower($content), 'key') ||
                    str_contains(strtolower($content), 'token') ||
                    str_contains(strtolower($content), 'secret')) {
                    
                    abort(403, "Demo data patterns are not allowed in production environment");
                }
            }
        }
    }
}
