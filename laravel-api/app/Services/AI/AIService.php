<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Log;

class AIService
{
    protected $providers = [
        'openai' => OpenAIService::class,
        'gemini' => GeminiService::class,
        'claude' => ClaudeService::class,
        'mistral' => MistralService::class,
        'grok' => GrokService::class,
        'groq' => GroqService::class,
        'openrouter' => OpenRouterService::class,
        'deepseek' => DeepSeekService::class,
        'huggingface' => HuggingFaceService::class,
    ];

    /**
     * Get the appropriate AI service based on provider
     *
     * @param string $provider
     * @return mixed
     * @throws \Exception
     */
    public function getProvider(string $provider)
    {
        if (!isset($this->providers[$provider])) {
            throw new \Exception("AI provider '{$provider}' not supported");
        }

        $providerClass = $this->providers[$provider];
        return new $providerClass();
    }

    /**
     * Process a chat message using the specified provider
     *
     * @param string $provider
     * @param string $message
     * @param array $config
     * @param bool $stream Whether to stream the response
     * @param array $context Conversation context
     * @return array|\Illuminate\Http\StreamedResponse
     * @throws \Exception
     */
    public function processMessage(string $provider, string $message, array $config = [], bool $stream = false, array $context = [])
    {
        try {
            $providerService = $this->getProvider($provider);

            // Add context to message if provided
            if (!empty($context)) {
                $config['context'] = $context;
            }

            // Log the request
            Log::info('AI Request', [
                'provider' => $provider,
                'message' => substr($message, 0, 100) . (strlen($message) > 100 ? '...' : ''),
                'context_messages' => count($context),
                'config' => array_filter($config, function ($key) {
                    return $key !== 'apiKey'; // Don't log API keys
                }, ARRAY_FILTER_USE_KEY)
            ]);

            if ($stream && method_exists($providerService, 'streamResponse')) {
                return $providerService->streamResponse($message, $config);
            }

            $response = $providerService->generateResponse($message, $config);

            // Log the response (excluding sensitive data)
            Log::info('AI Response', [
                'provider' => $provider,
                'success' => $response['success'] ?? false,
                'model' => $response['model'] ?? null,
                'usage' => $response['usage'] ?? null
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('AI Provider Error', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Try fallback if available
            if (isset($config['fallbackProvider']) && $config['fallbackProvider'] !== $provider) {
                Log::info('Attempting fallback to ' . $config['fallbackProvider']);
                return $this->processMessage($config['fallbackProvider'], $message, $config, $stream);
            }

            throw $e;
        }
    }

    /**
     * Get all available providers
     *
     * @return array
     */
    public function getAvailableProviders(): array
    {
        return array_keys($this->providers);
    }

    /**
     * Test connection to a provider
     *
     * @param string $provider
     * @param array $config
     * @return array
     */
    public function testConnection(string $provider, array $config): array
    {
        try {
            $providerService = $this->getProvider($provider);
            if (method_exists($providerService, 'testConnection')) {
                return $providerService->testConnection($config);
            }

            // Default test by sending a simple message
            $response = $providerService->generateResponse('Test connection', $config);
            return [
                'success' => $response['success'] ?? false,
                'message' => $response['success'] ? 'Connection successful' : 'Connection failed',
                'provider' => $provider,
                'model' => $response['model'] ?? null
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'provider' => $provider
            ];
        }
    }
}
