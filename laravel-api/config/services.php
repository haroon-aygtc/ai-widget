<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // AI Provider Services
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'api_url' => env('OPENAI_API_URL', 'https://api.openai.com/v1'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'api_url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

    'claude' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'api_url' => env('ANTHROPIC_API_URL', 'https://api.anthropic.com/v1'),
    ],

    'mistral' => [
        'api_key' => env('MISTRAL_API_KEY'),

        'api_url' => env('MISTRAL_API_URL', 'https://api.mistral.ai/v1'),
    ],

    'grok' => [
        'api_key' => env('GROK_API_KEY'),

        'api_url' => env('GROK_API_URL', 'https://api.x.ai/v1'),
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),

        'api_url' => env('GROQ_API_URL', 'https://api.groq.com/openai/v1'),
    ],

    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY'),

        'api_url' => env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1'),
    ],

    'deepseek' => [
        'api_key' => env('DEEPSEEK_API_KEY'),

        'api_url' => env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1'),
    ],

    'huggingface' => [
        'api_key' => env('HUGGINGFACE_API_KEY'),

        'api_url' => env('HUGGINGFACE_API_URL', 'https://api-inference.huggingface.co/models'),
    ],

];
