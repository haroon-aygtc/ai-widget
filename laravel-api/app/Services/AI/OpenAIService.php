<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\StreamedResponse;

class OpenAIService
{
    protected string $apiUrl = 'https://api.openai.com/v1/chat/completions';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate a response using OpenAI
     *
     * @param string $message
     * @param array $context
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $context = [])
    {
        // Use provider configuration
        $apiKey = $this->provider->getRawApiKey();
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;
        $advancedSettings = $this->provider->advanced_settings ?? [];
        $topP = $advancedSettings['top_p'] ?? 1.0;
        $frequencyPenalty = $advancedSettings['frequency_penalty'] ?? 0;
        $presencePenalty = $advancedSettings['presence_penalty'] ?? 0;

        if (!$apiKey) {
            throw new \Exception('OpenAI API key is required');
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

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->retry(3, 1000)
            ->post($this->apiUrl, [
                'model' => $model,
                'messages' => $messages,
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
                'top_p' => (float) $topP,
                'frequency_penalty' => (float) $frequencyPenalty,
                'presence_penalty' => (float) $presencePenalty,
                'stream' => false
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
                    'provider' => 'openai',
                    'provider_id' => $this->provider->id
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'openai',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('OpenAI API error: ' . $e->getMessage());
        }
    }

    /**
     * Stream a response from OpenAI
     *
     * @param string $message
     * @param array $config
     * @return StreamedResponse
     */
    public function streamResponse(string $message, array $context = [])
    {
        // Use provider configuration
        $apiKey = $this->provider->getRawApiKey();
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;
        $advancedSettings = $this->provider->advanced_settings ?? [];
        $topP = $advancedSettings['top_p'] ?? 1.0;

        return response()->stream(function () use ($apiKey, $model, $message, $context, $temperature, $maxTokens, $systemPrompt, $topP) {
            $curl = curl_init();

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

            $payload = json_encode([
                'model' => $model,
                'messages' => $messages,
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
                'top_p' => (float) $topP,
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

                    // Calculate the length of the data
                    $len = strlen($data);
                    flush();

                    // Return the number of bytes handled
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
     * Test connection to OpenAI
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
                    'provider' => 'openai'
                ];
            }

            \Log::info('Testing OpenAI API connection', [
                'model' => $this->provider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 7) . '...'
            ]);

            $result = $this->generateResponse('Hello, this is a test message.', []);

            if (!$result['success']) {
                $errorMessage = $result['error'] ?? 'Connection failed';

                // Provide more helpful error messages
                if (isset($result['status']) && $result['status'] === 401) {
                    $errorMessage = 'Authentication failed. Please check your OpenAI API key';
                }

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'provider' => 'openai',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'openai',
                'model' => $this->provider->model,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('OpenAI API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your OpenAI API key';
            }

            return [
                'success' => false,
                'message' => 'Connection error: ' . $errorMessage,
                'provider' => 'openai'
            ];
        }
    }

    /**
     * Get available models from OpenAI API
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

            \Log::info('Fetching OpenAI available models', [
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 5) . '...'
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->get('https://api.openai.com/v1/models');

            \Log::info('OpenAI models response', [
                'status' => $response->status(),
                'success' => $response->successful(),
                'body_length' => strlen($response->body())
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $models = [];

                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $model) {
                        // Filter to include only chat models
                        if (isset($model['id']) && (
                            strpos($model['id'], 'gpt-') === 0 ||
                            strpos($model['id'], 'text-') === 0 ||
                            strpos($model['id'], 'davinci') !== false ||
                            strpos($model['id'], 'o-') !== false)) {

                            $models[] = [
                                'id' => $model['id'],
                                'name' => $model['id'],
                                'description' => isset($model['description']) ? $model['description'] : 'OpenAI model'
                            ];
                        }
                    }
                } else {
                    \Log::warning('Unexpected OpenAI API response format', [
                        'response' => $data
                    ]);
                }

                if (empty($models)) {
                    \Log::warning('No OpenAI models found or all were filtered out', [
                        'response' => $data
                    ]);
                }

                return [
                    'success' => !empty($models),
                    'message' => empty($models) ? 'No suitable models found in API response' : '',
                    'models' => $models
                ];
            } else {
                $errorData = $response->json();
                $errorMessage = isset($errorData['error']['message'])
                    ? $errorData['error']['message']
                    : 'Failed to fetch models from OpenAI API';

                \Log::error('Failed to fetch OpenAI models', [
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
            \Log::error('Exception while fetching OpenAI models', [
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
