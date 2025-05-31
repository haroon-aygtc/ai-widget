<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'widget/*',
        'up', // Health check endpoint
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => env('APP_ENV') === 'production' ?
        explode(',', env('CORS_ALLOWED_ORIGINS', '')) :
        ['*'], // Allow all origins in development, restrict in production

    'allowed_origins_patterns' => env('APP_ENV') === 'production' ?
        explode(',', env('CORS_ALLOWED_PATTERNS', '')) :
        [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Origin',
        'Cache-Control',
        'Pragma',
    ],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Total-Count',
        'X-Current-Page',
        'X-Per-Page',
    ],

    'max_age' => env('CORS_MAX_AGE', 86400), // 24 hours

    'supports_credentials' => true,

];
