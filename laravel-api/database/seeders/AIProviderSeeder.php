<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AIProvider;
use App\Models\User;
use App\Services\AI\AIServiceFactory;

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

        $providers = AIServiceFactory::getAvailableProviders();

        foreach ($providers as $type => $config) {
            AIProvider::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'provider_type' => $type
                ],
                [
                    'name' => $config['name'],
                    'model' => 'dynamic', // Will be set dynamically from API
                    'api_key' => $this->getEnvApiKey($type), // Will be null if not set
                    'temperature' => 0.7,
                    'max_tokens' => 2048,
                    'system_prompt' => 'You are a helpful assistant.',
                    'advanced_settings' => $this->getDefaultAdvancedSettings($type),
                    'is_active' => $this->getEnvApiKey($type) ? true : false, // Active only if API key exists
                ]
            );
        }

        $this->command->info('AI Providers seeded successfully!');
        $this->command->info('Configure API keys in the admin panel to activate providers.');
    }



    /**
     * Get default advanced settings for a provider type.
     */
    private function getDefaultAdvancedSettings(string $type): array
    {
        return match ($type) {
            'claude' => ['top_p' => 1.0, 'top_k' => 5],
            'gemini' => ['top_p' => 0.9, 'top_k' => 40],
            'mistral' => ['top_p' => 1.0],
            'groq' => ['top_p' => 1.0],
            'deepseek' => ['top_p' => 1.0],
            'huggingface' => ['top_p' => 0.9, 'top_k' => 50],
            'grok' => ['top_p' => 1.0],
            'openrouter' => ['top_p' => 1.0],
            'openai' => [
                'top_p' => 0.95,
                'frequency_penalty' => 0,
                'presence_penalty' => 0,
            ],
            default => []
        };
    }

    /**
     * Get API key from environment variables.
     */
    private function getEnvApiKey(string $type): ?string
    {
        $envKey = match ($type) {
            'openai' => env('OPENAI_API_KEY'),
            'claude' => env('ANTHROPIC_API_KEY'),
            'gemini' => env('GEMINI_API_KEY'),
            'mistral' => env('MISTRAL_API_KEY'),
            'groq' => env('GROQ_API_KEY'),
            'deepseek' => env('DEEPSEEK_API_KEY'),
            'huggingface' => env('HUGGINGFACE_API_KEY'),
            'grok' => env('GROK_API_KEY'),
            'openrouter' => env('OPENROUTER_API_KEY'),
            default => null
        };

        // Don't use demo keys
        if ($envKey && str_starts_with($envKey, 'demo-')) {
            return null;
        }

        return $envKey;
    }
}
