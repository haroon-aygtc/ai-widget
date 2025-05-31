<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class MistralService
{
    protected string $baseUrl = 'https://api.mistral.ai/v1';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate response from Mistral API.
     *
     * @param string $message
     * @param array $context
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $context = []): array
    {
        $startTime = microtime(true);

        try {
            // Use provider configuration
            $apiKey = $this->provider->getRawApiKey();
            $model = $this->provider->model;
            $temperature = $this->provider->temperature;
            $maxTokens = $this->provider->max_tokens;
            $systemPrompt = $this->provider->system_prompt;
            $advancedSettings = $this->provider->advanced_settings ?? [];
            $topP = $advancedSettings['top_p'] ?? 1.0;

            if (!$apiKey) {
                throw new \Exception('Mistral API key is required');
            }

            $messages = [
                [
                    'role' => 'system',
                    'content' => $systemPrompt ?? 'You are a helpful assistant.'
                ]
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
            $messages[] = [
                'role' => 'user',
                'content' => $message
            ];

            $payload = [
                'model' => $model,
                'messages' => $messages,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'top_p' => $topP,
                'stream' => false,
            ];

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/chat/completions', $payload);

            if (!$response->successful()) {
                throw new \Exception('Mistral API error: ' . $response->body());
            }

            $data = $response->json();

            if (!isset($data['choices'][0]['message']['content'])) {
                throw new \Exception('Invalid response format from Mistral API');
            }

            $responseTime = microtime(true) - $startTime;
            $responseText = $data['choices'][0]['message']['content'];

            return [
                'success' => true,
                'content' => $responseText,
                'model' => $data['model'] ?? $model,
                'response_time' => $responseTime,
                'usage' => [
                    'prompt_tokens' => $data['usage']['prompt_tokens'] ?? null,
                    'completion_tokens' => $data['usage']['completion_tokens'] ?? null,
                    'total_tokens' => $data['usage']['total_tokens'] ?? null,
                ],
                'finish_reason' => $data['choices'][0]['finish_reason'] ?? 'stop',
                'provider' => 'mistral',
                'provider_id' => $this->provider->id
            ];
        } catch (\Exception $e) {
            Log::error('Mistral API Error', [
                'message' => $e->getMessage(),
                'provider_id' => $this->provider->id
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'response_time' => microtime(true) - $startTime,
                'provider' => 'mistral',
                'provider_id' => $this->provider->id
            ];
        }
    }

    /**
     * Test connection to Mistral API.
     *
     * @param array $config
     * @return array
     */
    public function testConnection(array $config): array
    {
        try {
            $apiKey = $this->provider->getRawApiKey();

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'mistral'
                ];
            }

            \Log::info('Testing Mistral API connection', [
                'model' => $this->provider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 6) . '...'
            ]);

            $result = $this->generateResponse('Hello, this is a test message.', []);

            if (!$result['success']) {
                $errorMessage = $result['message'] ?? 'Connection failed';

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'provider' => 'mistral',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'mistral',
                'model' => $this->provider->model,
                'response_time' => $result['response_time'] ?? null,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('Mistral API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your Mistral API key';
            }

            return [
                'success' => false,
                'message' => 'Connection error: ' . $errorMessage,
                'provider' => 'mistral'
            ];
        }
    }

    /**
     * Stream response from Mistral API.
     *
     * @param string $message
     * @param array $context
     * @return StreamedResponse
     */
    public function streamResponse(string $message, array $context = []): StreamedResponse
    {
        return response()->stream(function () use ($message, $context) {
            try {
                // Use provider configuration
                $apiKey = $this->provider->getRawApiKey();
                $model = $this->provider->model;
                $temperature = $this->provider->temperature;
                $maxTokens = $this->provider->max_tokens;
                $systemPrompt = $this->provider->system_prompt;
                $advancedSettings = $this->provider->advanced_settings ?? [];
                $topP = $advancedSettings['top_p'] ?? 1.0;

                if (!$apiKey) {
                    throw new \Exception('Mistral API key is required');
                }

                $messages = [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt ?? 'You are a helpful assistant.'
                    ]
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
                $messages[] = [
                    'role' => 'user',
                    'content' => $message
                ];

                $payload = [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => $temperature,
                    'max_tokens' => $maxTokens,
                    'top_p' => $topP,
                    'stream' => true,
                ];

                $response = Http::timeout(60)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->baseUrl . '/chat/completions', $payload);

                if ($response->successful()) {
                    $body = $response->body();
                    $lines = explode("\n", $body);

                    foreach ($lines as $line) {
                        if (strpos($line, 'data: ') === 0) {
                            echo $line . "\n";
                            ob_flush();
                            flush();
                        }
                    }
                } else {
                    echo "data: " . json_encode(['error' => 'API request failed']) . "\n\n";
                }
            } catch (\Exception $e) {
                echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
            }

            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }

    /**
     * Get available models from Mistral API
     *
     * @return array
     */
    public function getAvailableModels(): array
    {
        try {
            $apiKey = $this->provider->getRawApiKey();

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'models' => []
                ];
            }

            \Log::info('Fetching Mistral available models', [
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 4) . '...'
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->get($this->baseUrl . '/models');

            \Log::info('Mistral models response', [
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
                                'description' => isset($model['description']) ? $model['description'] : 'Mistral model'
                            ];
                        }
                    }
                } else {
                    \Log::warning('Unexpected Mistral API response format', [
                        'response' => $data
                    ]);
                }

                if (empty($models)) {
                    \Log::warning('No Mistral models found in API response', [
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
                    : 'Failed to fetch models from Mistral API';

                \Log::error('Failed to fetch Mistral models', [
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
            \Log::error('Exception while fetching Mistral models', [
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
