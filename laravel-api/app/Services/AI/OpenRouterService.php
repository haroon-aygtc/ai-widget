<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class OpenRouterService
{
    protected string $apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate a response using OpenRouter
     *
     * @param string $message
     * @param array $context
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $context = [])
    {
        // Use provider configuration
        $apiKey = $this->provider->decrypted_api_key;
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;

        if (!$apiKey) {
            throw new \Exception('OpenRouter API key is required');
        }

        // Build messages array with context
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];

        // Add conversation context if provided
        if (!empty($context['conversation_history'])) {
            foreach ($context['conversation_history'] as $msg) {
                $messages[] = [
                    'role' => $msg['role'] ?? 'user',
                    'content' => $msg['content']
                ];
            }
        }

        // Add current message
        $messages[] = ['role' => 'user', 'content' => $message];

        \Log::debug('OpenRouter API request', [
            'model' => $model,
            'messages_count' => count($messages),
            'api_key_length' => strlen($apiKey),
            'api_key_prefix' => substr($apiKey, 0, 6) . '...'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'), // Required by OpenRouter
                'X-Title' => config('app.name', 'AI Widget') // Required by OpenRouter
            ])
            ->timeout(60)
            ->retry(3, 1000)
            ->post($this->apiUrl, [
                'model' => $model,
                'messages' => $messages,
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'content' => $data['choices'][0]['message']['content'] ?? '',
                    'model' => $data['model'] ?? $model,
                    'usage' => $data['usage'] ?? [
                        'prompt_tokens' => 0,
                        'completion_tokens' => 0,
                        'total_tokens' => 0,
                    ],
                    'id' => $data['id'] ?? null,
                    'created' => $data['created'] ?? time(),
                    'provider' => 'openrouter',
                    'provider_id' => $this->provider->id
                ];
            } else {
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Unknown error';

                \Log::error('OpenRouter API error response', [
                    'status' => $response->status(),
                    'error_message' => $errorMessage,
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => $errorMessage,
                    'status' => $response->status(),
                    'provider' => 'openrouter',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('OpenRouter API error: ' . $e->getMessage());
        }
    }

    /**
     * Test connection to OpenRouter
     *
     * @param array $config
     * @return array
     */
    public function testConnection(array $config): array
    {
        try {
            $apiKey = $this->provider->decrypted_api_key;

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'openrouter'
                ];
            }

            \Log::info('Testing OpenRouter API connection', [
                'model' => $this->provider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 6) . '...'
            ]);

            // If model is "dynamic", get available models first
            if ($this->provider->model === 'dynamic') {
                $modelsResult = $this->getAvailableModels();
                if ($modelsResult['success'] && !empty($modelsResult['models'])) {
                    $this->provider->model = $modelsResult['models'][0]['id'];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Could not fetch available models',
                        'provider' => 'openrouter'
                    ];
                }
            }

            $result = $this->generateResponse('Hello, this is a test message.', []);

            if (!$result['success']) {
                $errorMessage = $result['error'] ?? 'Connection failed';

                // Provide more helpful error messages
                if (isset($result['status']) && $result['status'] === 401) {
                    $errorMessage = 'Authentication failed. Please check your OpenRouter API key';
                }

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'provider' => 'openrouter',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'openrouter',
                'model' => $this->provider->model,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('OpenRouter API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your OpenRouter API key';
            }

            return [
                'success' => false,
                'message' => 'Connection error: ' . $errorMessage,
                'provider' => 'openrouter'
            ];
        }
    }

    /**
     * Get available models from OpenRouter API
     *
     * @return array
     */
    public function getAvailableModels(): array
    {
        try {
            $apiKey = $this->provider->decrypted_api_key;

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'models' => []
                ];
            }

            \Log::info('Fetching OpenRouter available models', [
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 5) . '...'
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
                'X-Title' => config('app.name', 'AI Widget')
            ])
            ->timeout(10)
            ->get($this->apiUrl . '/models');

            \Log::info('OpenRouter models response', [
                'status' => $response->status(),
                'success' => $response->successful(),
                'body_length' => strlen($response->body())
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $models = [];

                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $model) {
                        if (isset($model['id'])) {
                            $models[] = [
                                'id' => $model['id'],
                                'name' => $model['id'],
                                'description' => $model['context_length'] ?
                                    "Context: {$model['context_length']} tokens" :
                                    'OpenRouter model'
                            ];
                        }
                    }
                } else {
                    \Log::warning('Unexpected OpenRouter API response format', [
                        'response' => $data
                    ]);
                }

                if (empty($models)) {
                    \Log::warning('No OpenRouter models found from API response', [
                        'response' => $data
                    ]);
                }

                return [
                    'success' => !empty($models),
                    'message' => empty($models) ? 'No models returned from API' : '',
                    'models' => $models
                ];
            } else {
                $errorData = $response->json();
                $errorMessage = isset($errorData['error']['message'])
                    ? $errorData['error']['message']
                    : 'Failed to fetch models from OpenRouter API';

                \Log::error('Failed to fetch OpenRouter models', [
                    'status' => $response->status(),
                    'error' => $errorMessage,
                    'body' => $response->body()
                ]);

                return [
                    'success' => false,
                    'message' => 'API error: ' . $errorMessage,
                    'models' => []
                ];
            }
        } catch (\Exception $e) {
            \Log::error('Exception while fetching OpenRouter models', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'models' => []
            ];
        }
    }
}
