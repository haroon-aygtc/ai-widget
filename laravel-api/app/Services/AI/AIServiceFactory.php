<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use App\Services\AI\OpenAIService;
use App\Services\AI\ClaudeService;
use App\Services\AI\GeminiService;
use App\Services\AI\MistralService;
use App\Services\AI\GroqService;
use App\Services\AI\DeepSeekService;
use App\Services\AI\HuggingFaceService;
use App\Services\AI\GrokService;
use App\Services\AI\OpenRouterService;
use InvalidArgumentException;

class AIServiceFactory
{
    /**
     * Create an AI service instance based on provider type.
     *
     * @param AIProvider $provider
     * @return mixed
     * @throws InvalidArgumentException
     */
    public static function create(AIProvider $provider)
    {
        // if (!$provider->is_active) {
        //     throw new InvalidArgumentException("AI Provider {$provider->provider_type} is not active");
        // }

        return match ($provider->provider_type) {
            'openai' => new OpenAIService($provider),
            'claude' => new ClaudeService($provider),
            'gemini' => new GeminiService($provider),
            'mistral' => new MistralService($provider),
            'groq' => new GroqService($provider),
            'deepseek' => new DeepSeekService($provider),
            'huggingface' => new HuggingFaceService($provider),
            'grok' => new GrokService($provider),
            'openrouter' => new OpenRouterService($provider),
            default => throw new InvalidArgumentException("Unsupported AI provider: {$provider->provider_type}")
        };
    }

    /**
     * Get available provider templates (metadata only, not user configurations)
     * This returns the available provider types that users can configure
     *
     * @return array
     */
    public static function getAvailableProviders(): array
    {
        // Try to get provider templates from system settings (allows admin customization)
        try {
            if (class_exists('\App\Models\SystemSetting')) {
                $providerSettings = \App\Models\SystemSetting::where('key', 'available_providers')->first();

                if ($providerSettings && !empty($providerSettings->value)) {
                    return $providerSettings->value;
                }
            }
        } catch (\Exception $e) {
            // Settings table might not exist or be available during migrations
            \Log::debug('Could not load provider settings from database: ' . $e->getMessage());
        }

        // Fallback to default provider templates
        return self::getDefaultProviderTemplates();
    }

    /**
     * Get default provider templates (used as fallback or for initial setup)
     *
     * @return array
     */
    public static function getDefaultProviderTemplates(): array
    {
        return [
            'openai' => [
                'name' => 'OpenAI',
                'description' => 'GPT models with dynamic model discovery',
                'logo' => '🤖',
                'supported_features' => ['chat', 'streaming', 'function_calling'],
                'api_endpoint' => 'https://api.openai.com/v1',
                'documentation_url' => 'https://platform.openai.com/docs',
                'pricing_info' => 'Pay per token usage'
            ],
            'claude' => [
                'name' => 'Anthropic Claude',
                'description' => 'Claude models with dynamic model discovery',
                'logo' => '🧠',
                'supported_features' => ['chat', 'streaming', 'long_context'],
                'api_endpoint' => 'https://api.anthropic.com/v1',
                'documentation_url' => 'https://docs.anthropic.com',
                'pricing_info' => 'Pay per token usage'
            ],
            'gemini' => [
                'name' => 'Google Gemini',
                'description' => 'Gemini models with dynamic model discovery',
                'logo' => '🌀',
                'supported_features' => ['chat', 'streaming', 'multimodal'],
                'api_endpoint' => 'https://generativelanguage.googleapis.com/v1',
                'documentation_url' => 'https://ai.google.dev/docs',
                'pricing_info' => 'Free tier available'
            ],
            'mistral' => [
                'name' => 'Mistral AI',
                'description' => 'Mistral Large, Medium, Small',
                'logo' => '🌪️',
                'supported_features' => ['chat', 'streaming'],
                'models' => ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
                'api_endpoint' => 'https://api.mistral.ai/v1',
                'documentation_url' => 'https://docs.mistral.ai',
                'pricing_info' => 'Pay per token usage'
            ],
            'groq' => [
                'name' => 'Groq',
                'description' => 'Ultra-fast inference',
                'logo' => '⚡',
                'supported_features' => ['chat', 'streaming', 'fast_inference'],
                'models' => ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
                'api_endpoint' => 'https://api.groq.com/openai/v1',
                'documentation_url' => 'https://console.groq.com/docs',
                'pricing_info' => 'Free tier available'
            ],
            'deepseek' => [
                'name' => 'DeepSeek',
                'description' => 'DeepSeek Chat, Coder',
                'logo' => '🔍',
                'supported_features' => ['chat', 'coding'],
                'models' => ['deepseek-chat', 'deepseek-coder'],
                'api_endpoint' => 'https://api.deepseek.com/v1',
                'documentation_url' => 'https://platform.deepseek.com/docs',
                'pricing_info' => 'Competitive pricing'
            ],
            'huggingface' => [
                'name' => 'HuggingFace',
                'description' => 'Open source models',
                'logo' => '🤗',
                'supported_features' => ['chat', 'open_source'],
                'models' => ['meta-llama/Llama-2-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
                'api_endpoint' => 'https://api-inference.huggingface.co',
                'documentation_url' => 'https://huggingface.co/docs',
                'pricing_info' => 'Free tier available'
            ],
            'grok' => [
                'name' => 'Grok (X.AI)',
                'description' => 'Grok-1 model',
                'logo' => '✖️',
                'supported_features' => ['chat', 'humor'],
                'models' => ['grok-1', 'grok-1.5'],
                'api_endpoint' => 'https://api.x.ai/v1',
                'documentation_url' => 'https://docs.x.ai',
                'pricing_info' => 'Premium pricing'
            ],
            'openrouter' => [
                'name' => 'OpenRouter',
                'description' => 'Multiple model access',
                'logo' => '🔄',
                'supported_features' => ['chat', 'multi_provider'],
                'models' => ['openai/gpt-4o', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct'],
                'api_endpoint' => 'https://openrouter.ai/api/v1',
                'documentation_url' => 'https://openrouter.ai/docs',
                'pricing_info' => 'Unified pricing across providers'
            ]
        ];
    }

    /**
     * Test connection for a provider configuration.
     *
     * @param string $providerType
     * @param string $apiKey
     * @param array $config
     * @return array
     */
    public static function testConnection(string $providerType, string $apiKey, array $config = []): array
    {
        try {
            // Create a temporary provider instance for testing
            $tempProvider = new AIProvider([
                'provider_type' => $providerType,
                'api_key' => $apiKey,
                'model' => $config['model'] ?? 'dynamic',
                'temperature' => $config['temperature'] ?? 0.7,
                'max_tokens' => $config['max_tokens'] ?? 100,
                'system_prompt' => 'You are a helpful assistant.',
                'advanced_settings' => $config['advanced_settings'] ?? [],
                'is_active' => true
            ]);

            $service = self::create($tempProvider);

            // Send a simple test message
            $response = $service->generateResponse('Hello, this is a connection test. Please respond with "Connection successful!"');

            return [
                'success' => true,
                'message' => 'Connection successful!',
                'response' => $response['content'] ?? 'Test completed',
                'provider' => $providerType
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'provider' => $providerType
            ];
        }
    }

    /**
     * Get available models for a provider type.
     *
     * @param string $providerType
     * @param string $apiKey
     * @return array
     */
    public static function getAvailableModels(string $providerType, string $apiKey): array
    {
        try {
            \Log::info('Fetching models for provider', [
                'provider_type' => $providerType,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 5) . '...'
            ]);

            // Create a temporary provider instance
            $tempProvider = new AIProvider([
                'provider_type' => $providerType,
                'api_key' => $apiKey,
                'model' => 'temp',
                'temperature' => 0.7,
                'max_tokens' => 100,
                'system_prompt' => 'You are a helpful assistant.',
                'is_active' => true
            ]);

            // Create service instance
            $service = self::create($tempProvider);

            // Get available models
            $result = $service->getAvailableModels();

            // Pass through the result from the service without modification
            return $result;
        } catch (\Exception $e) {
            \Log::error('Failed to get models for provider', [
                'provider_type' => $providerType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error fetching models: ' . $e->getMessage(),
                'models' => []
            ];
        }
    }
}
