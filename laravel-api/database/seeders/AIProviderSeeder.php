<?php

namespace Database\Seeders;

use App\Models\AIProvider;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class AIProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user or create a test user
        $user = User::first() ?? User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        // Only create providers if environment variables are set (not in demo mode)
        $providers = [];

        // Check if we're in production and prevent demo data
        if (app()->environment('production') && env('ALLOW_DEMO_DATA', false) !== true) {
            $this->command->warn('Skipping AI provider seeding in production environment.');
            $this->command->info('Set ALLOW_DEMO_DATA=true in .env to override this behavior.');
            return;
        }

        // OpenAI Provider
        if (env('OPENAI_API_KEY') && !str_starts_with(env('OPENAI_API_KEY'), 'demo-')) {
            $providers[] = [
                'user_id' => $user->id,
                'provider_type' => 'openai',
                'api_key' => env('OPENAI_API_KEY'),
                'model' => env('OPENAI_DEFAULT_MODEL', 'gpt-4o'),
                'temperature' => (float) env('OPENAI_TEMPERATURE', 0.7),
                'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 2048),
                'system_prompt' => env('OPENAI_SYSTEM_PROMPT', 'You are a helpful AI assistant. Provide accurate, concise, and helpful responses.'),
                'advanced_settings' => [
                    'stream_response' => env('OPENAI_STREAM_RESPONSE', true),
                    'context_window' => (int) env('OPENAI_CONTEXT_WINDOW', 4096),
                    'top_p' => (float) env('OPENAI_TOP_P', 0.95),
                    'frequency_penalty' => (float) env('OPENAI_FREQUENCY_PENALTY', 0),
                    'presence_penalty' => (float) env('OPENAI_PRESENCE_PENALTY', 0),
                    'available_models' => [
                        'gpt-4o',
                        'gpt-4-turbo',
                        'gpt-4',
                        'gpt-3.5-turbo',
                        'gpt-3.5-turbo-16k'
                    ]
                ],
                'is_active' => env('OPENAI_IS_ACTIVE', true),
            ];
        }

        // Claude Provider
        if (env('ANTHROPIC_API_KEY') && !str_starts_with(env('ANTHROPIC_API_KEY'), 'demo-')) {
            $providers[] = [
                'user_id' => $user->id,
                'provider_type' => 'claude',
                'api_key' => env('ANTHROPIC_API_KEY'),
                'model' => env('ANTHROPIC_DEFAULT_MODEL', 'claude-3-sonnet-20240229'),
                'temperature' => (float) env('ANTHROPIC_TEMPERATURE', 0.7),
                'max_tokens' => (int) env('ANTHROPIC_MAX_TOKENS', 2048),
                'system_prompt' => env('ANTHROPIC_SYSTEM_PROMPT', 'You are Claude, an AI assistant created by Anthropic. Be helpful, harmless, and honest.'),
                'advanced_settings' => [
                    'stream_response' => env('ANTHROPIC_STREAM_RESPONSE', true),
                    'context_window' => (int) env('ANTHROPIC_CONTEXT_WINDOW', 4096),
                    'top_p' => (float) env('ANTHROPIC_TOP_P', 0.95),
                    'available_models' => [
                        'claude-3-opus-20240229',
                        'claude-3-sonnet-20240229',
                        'claude-3-haiku-20240307',
                        'claude-2.1',
                        'claude-2.0'
                    ]
                ],
                'is_active' => env('ANTHROPIC_IS_ACTIVE', false),
            ];
        }

        // Gemini Provider
        if (env('GEMINI_API_KEY') && !str_starts_with(env('GEMINI_API_KEY'), 'demo-')) {
            $providers[] = [
                'user_id' => $user->id,
                'provider_type' => 'gemini',
                'api_key' => env('GEMINI_API_KEY'),
                'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-pro'),
                'temperature' => (float) env('GEMINI_TEMPERATURE', 0.7),
                'max_tokens' => (int) env('GEMINI_MAX_TOKENS', 2048),
                'system_prompt' => env('GEMINI_SYSTEM_PROMPT', 'You are Gemini, Google\'s AI assistant. Provide helpful and accurate information.'),
                'advanced_settings' => [
                    'stream_response' => env('GEMINI_STREAM_RESPONSE', true),
                    'context_window' => (int) env('GEMINI_CONTEXT_WINDOW', 4096),
                    'top_p' => (float) env('GEMINI_TOP_P', 0.95),
                    'safety_settings' => [
                        'harassment' => env('GEMINI_SAFETY_HARASSMENT', 'BLOCK_MEDIUM_AND_ABOVE'),
                        'hate_speech' => env('GEMINI_SAFETY_HATE_SPEECH', 'BLOCK_MEDIUM_AND_ABOVE'),
                        'sexually_explicit' => env('GEMINI_SAFETY_SEXUALLY_EXPLICIT', 'BLOCK_MEDIUM_AND_ABOVE'),
                        'dangerous_content' => env('GEMINI_SAFETY_DANGEROUS_CONTENT', 'BLOCK_MEDIUM_AND_ABOVE')
                    ],
                    'available_models' => [
                        'gemini-pro',
                        'gemini-pro-vision',
                        'gemini-ultra',
                        'gemini-flash'
                    ]
                ],
                'is_active' => env('GEMINI_IS_ACTIVE', false),
            ];
        }
        // Additional providers can be added here following the same pattern
        // Each provider should check for environment variables before being added

        if (empty($providers)) {
            $this->command->warn('No AI providers configured. Please set environment variables for at least one provider.');
            $this->command->info('Example: Set OPENAI_API_KEY in your .env file to configure OpenAI.');
            return;
        }

        foreach ($providers as $providerData) {
            AIProvider::updateOrCreate(
                [
                    'user_id' => $providerData['user_id'],
                    'provider_type' => $providerData['provider_type']
                ],
                $providerData
            );
        }

        $this->command->info('AI Providers seeded successfully!');
        $this->command->info('Note: Replace demo API keys with real ones for production use.');
    }
}
