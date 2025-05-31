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
        if (!$provider->is_active) {
            throw new InvalidArgumentException("AI Provider {$provider->provider_type} is not active");
        }

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
     * Get available AI service types.
     *
     * @return array
     */
    public static function getAvailableProviders(): array
    {
        return [
            'openai' => [
                'name' => 'OpenAI',
                'description' => 'GPT-4, GPT-3.5 Turbo models',
                'logo' => '🤖',
                'supported_features' => ['chat', 'streaming', 'function_calling'],
                'models' => ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
            ],
            'claude' => [
                'name' => 'Anthropic Claude',
                'description' => 'Claude 3 Opus, Sonnet, Haiku',
                'logo' => '🧠',
                'supported_features' => ['chat', 'streaming', 'long_context'],
                'models' => ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
            ],
            'gemini' => [
                'name' => 'Google Gemini',
                'description' => 'Gemini Pro, Ultra models',
                'logo' => '🌀',
                'supported_features' => ['chat', 'streaming', 'multimodal'],
                'models' => ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra']
            ],
            'mistral' => [
                'name' => 'Mistral AI',
                'description' => 'Mistral Large, Medium, Small',
                'logo' => '🌪️',
                'supported_features' => ['chat', 'streaming'],
                'models' => ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest']
            ],
            'groq' => [
                'name' => 'Groq',
                'description' => 'Ultra-fast inference',
                'logo' => '⚡',
                'supported_features' => ['chat', 'streaming', 'fast_inference'],
                'models' => ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768']
            ],
            'deepseek' => [
                'name' => 'DeepSeek',
                'description' => 'DeepSeek Chat, Coder',
                'logo' => '🔍',
                'supported_features' => ['chat', 'coding'],
                'models' => ['deepseek-chat', 'deepseek-coder']
            ],
            'huggingface' => [
                'name' => 'HuggingFace',
                'description' => 'Open source models',
                'logo' => '🤗',
                'supported_features' => ['chat', 'open_source'],
                'models' => ['meta-llama/Llama-2-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1']
            ],
            'grok' => [
                'name' => 'Grok (X.AI)',
                'description' => 'Grok-1 model',
                'logo' => '✖️',
                'supported_features' => ['chat', 'humor'],
                'models' => ['grok-1', 'grok-1.5']
            ],
            'openrouter' => [
                'name' => 'OpenRouter',
                'description' => 'Multiple model access',
                'logo' => '🔄',
                'supported_features' => ['chat', 'multi_provider'],
                'models' => ['openai/gpt-4o', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct']
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
                'model' => $config['model'] ?? self::getDefaultModel($providerType),
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
     * Get default model for a provider type.
     *
     * @param string $providerType
     * @return string
     */
    private static function getDefaultModel(string $providerType): string
    {
        return match ($providerType) {
            'openai' => 'gpt-4o',
            'claude' => 'claude-3-sonnet-20240229',
            'gemini' => 'gemini-pro',
            'mistral' => 'mistral-large-latest',
            'groq' => 'llama3-70b-8192',
            'deepseek' => 'deepseek-chat',
            'huggingface' => 'meta-llama/Llama-2-70b-chat-hf',
            'grok' => 'grok-1',
            'openrouter' => 'openai/gpt-4o',
            default => 'gpt-4o'
        };
    }
}
