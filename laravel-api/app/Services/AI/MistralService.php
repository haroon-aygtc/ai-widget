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
            $apiKey = $this->provider->api_key;
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
            $result = $this->generateResponse('Hello, this is a test message.', []);

            return [
                'success' => $result['success'],
                'message' => $result['success'] ? 'Connection successful' : $result['message'],
                'provider' => 'mistral',
                'model' => $this->provider->model,
                'response_time' => $result['response_time'] ?? null
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
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
                $apiKey = $this->provider->api_key;
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
     * Get available models.
     *
     * @return array
     */
    public function getAvailableModels(): array
    {
        return [
            'mistral-small-latest' => 'Mistral Small',
            'mistral-medium-latest' => 'Mistral Medium',
            'mistral-large-latest' => 'Mistral Large',
            'open-mistral-7b' => 'Open Mistral 7B',
            'open-mixtral-8x7b' => 'Open Mixtral 8x7B',
            'open-mixtral-8x22b' => 'Open Mixtral 8x22B',
        ];
    }
}
