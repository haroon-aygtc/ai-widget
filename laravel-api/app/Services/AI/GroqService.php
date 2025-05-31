<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GroqService
{
    protected string $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate a response using Groq
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
            throw new \Exception('Groq API key is required');
        }

        // Validate API key format - Groq API keys typically start with "gsk_"
        if (!preg_match('/^gsk_/i', $apiKey)) {
            \Log::warning('Groq API key may be invalid - does not match expected format', [
                'key_prefix' => substr($apiKey, 0, 4),
                'key_length' => strlen($apiKey)
            ]);
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

        \Log::debug('Groq API request', [
            'model' => $model,
            'messages_count' => count($messages),
            'api_key_length' => strlen($apiKey),
            'api_key_prefix' => substr($apiKey, 0, 4) . '...'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30) // Groq is known for speed
            ->retry(3, 1000)
            ->post($this->apiUrl, [
                'model' => $model,
                'messages' => $messages,
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                \Log::debug('Groq API successful response', [
                    'model' => $data['model'] ?? $model,
                    'usage' => $data['usage'] ?? [],
                    'response_length' => strlen($data['choices'][0]['message']['content'] ?? '')
                ]);

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
                    'provider' => 'groq',
                    'provider_id' => $this->provider->id
                ];
            } else {
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Unknown error';
                $errorType = $errorData['error']['type'] ?? '';
                $errorCode = $errorData['error']['code'] ?? '';

                \Log::error('Groq API error response', [
                    'status' => $response->status(),
                    'error_type' => $errorType,
                    'error_code' => $errorCode,
                    'error_message' => $errorMessage,
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => $errorMessage,
                    'error_type' => $errorType,
                    'error_code' => $errorCode,
                    'status' => $response->status(),
                    'provider' => 'groq',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            $errorMessage = 'Groq API error: ' . $e->getMessage();
            \Log::error($errorMessage, [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception($errorMessage);
        }
    }

    /**
     * Stream a response from Groq
     *
     * @param string $message
     * @param array $context
     * @return \Illuminate\Http\StreamedResponse
     */
    public function streamResponse(string $message, array $context = [])
    {
        // Use provider configuration
        $apiKey = $this->provider->decrypted_api_key;
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;

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

        return response()->stream(function () use ($apiKey, $model, $messages, $temperature, $maxTokens) {
            $curl = curl_init();

            $payload = json_encode([
                'model' => $model,
                'messages' => $messages,
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
                'stream' => true
            ]);

            curl_setopt_array($curl, [
                CURLOPT_URL => $this->apiUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey
                ],
                CURLOPT_WRITEFUNCTION => function ($curl, $data) {
                    echo $data;
                    $len = strlen($data);
                    flush();
                    return $len;
                }
            ]);

            curl_exec($curl);
            curl_close($curl);
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    /**
     * Test connection to Groq
     *
     * @param array $config
     * @return array
     */
    public function testConnection(array $config): array
    {
        try {
            // Simple validation of API key format
            $apiKey = $this->provider->decrypted_api_key;

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'groq'
                ];
            }

            // Validate API key format - Groq API keys typically start with "gsk_"
            if (!preg_match('/^gsk_/i', $apiKey)) {
                \Log::warning('Groq API key may be invalid - does not match expected format', [
                    'key_prefix' => substr($apiKey, 0, 4),
                    'key_length' => strlen($apiKey)
                ]);
            }

            \Log::info('Testing Groq API connection', [
                'model' => $this->provider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 4) . '...'
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
                        'provider' => 'groq'
                    ];
                }
            }

            // Make a simple test request
            $testMessage = 'Hello, this is a test message. Please respond with "Connection successful!"';
            $result = $this->generateResponse($testMessage, []);

            if (!$result['success']) {
                $errorMessage = $result['error'] ?? 'Connection failed';

                // Provide more helpful error messages
                if (isset($result['error_code']) && $result['error_code'] === 'invalid_api_key') {
                    $errorMessage = 'Invalid API key. Please make sure you are using a valid Groq API key (starts with "gsk_")';
                } elseif (isset($result['status']) && $result['status'] === 401) {
                    $errorMessage = 'Authentication failed. Please check your API key';
                }

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'provider' => 'groq',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'groq',
                'model' => $this->provider->model,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('Groq API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, 'invalid_api_key') !== false) {
                $errorMessage = 'Invalid API key. Please make sure you are using a valid Groq API key (starts with "gsk_")';
            } elseif (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your API key';
            }

            return [
                'success' => false,
                'message' => $errorMessage,
                'provider' => 'groq'
            ];
        }
    }

    /**
     * Get available models from Groq API
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

            \Log::info('Fetching Groq available models', [
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 4) . '...'
            ]);

            // The Groq API endpoint for models is /models
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->get('https://api.groq.com/v1/models');

            \Log::info('Groq models response', [
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
                                'description' => isset($model['description']) ? $model['description'] : 'Groq model'
                            ];
                        }
                    }
                } else {
                    \Log::warning('Unexpected Groq API response format', [
                        'response' => $data
                    ]);
                }

                if (empty($models)) {
                    \Log::warning('No Groq models found in API response', [
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
                    : 'Failed to fetch models from Groq API';

                \Log::error('Failed to fetch Groq models', [
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
            \Log::error('Exception while fetching Groq models', [
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
