<?php

namespace App\Services\AI;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class MistralService
{
    protected string $baseUrl = 'https://api.mistral.ai/v1';
    protected array $defaultConfig = [
        'model' => 'mistral-small-latest',
        'temperature' => 0.7,
        'maxTokens' => 2048,
        'topP' => 1.0,
    ];

    /**
     * Generate response from Mistral API.
     *
     * @param string $message
     * @param array $config
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $config = []): array
    {
        $startTime = microtime(true);

        try {
            $config = array_merge($this->defaultConfig, $config);

            if (empty($config['apiKey'])) {
                throw new \Exception('Mistral API key is required');
            }

            $messages = [
                [
                    'role' => 'system',
                    'content' => $config['systemPrompt'] ?? 'You are a helpful assistant.'
                ],
                [
                    'role' => 'user',
                    'content' => $message
                ]
            ];

            $payload = [
                'model' => $config['model'],
                'messages' => $messages,
                'temperature' => $config['temperature'],
                'max_tokens' => $config['maxTokens'],
                'top_p' => $config['topP'],
                'stream' => false,
            ];

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $config['apiKey'],
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
                'response' => $responseText,
                'model' => $data['model'] ?? $config['model'],
                'response_time' => $responseTime,
                'token_usage' => [
                    'prompt_tokens' => $data['usage']['prompt_tokens'] ?? null,
                    'completion_tokens' => $data['usage']['completion_tokens'] ?? null,
                    'total_tokens' => $data['usage']['total_tokens'] ?? null,
                ],
                'finish_reason' => $data['choices'][0]['finish_reason'] ?? 'stop'
            ];
        } catch (\Exception $e) {
            Log::error('Mistral API Error', [
                'message' => $e->getMessage(),
                'config' => array_filter($config, fn($key) => $key !== 'apiKey', ARRAY_FILTER_USE_KEY)
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'response_time' => microtime(true) - $startTime
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
            $result = $this->generateResponse('Hello, this is a test message.', $config);

            return [
                'success' => $result['success'],
                'message' => $result['success'] ? 'Connection successful' : $result['message'],
                'provider' => 'mistral',
                'model' => $config['model'] ?? $this->defaultConfig['model'],
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
     * @param array $config
     * @return StreamedResponse
     */
    public function streamResponse(string $message, array $config = []): StreamedResponse
    {
        return response()->stream(function () use ($message, $config) {
            try {
                $config = array_merge($this->defaultConfig, $config);

                if (empty($config['apiKey'])) {
                    throw new \Exception('Mistral API key is required');
                }

                $messages = [
                    [
                        'role' => 'system',
                        'content' => $config['systemPrompt'] ?? 'You are a helpful assistant.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $message
                    ]
                ];

                $payload = [
                    'model' => $config['model'],
                    'messages' => $messages,
                    'temperature' => $config['temperature'],
                    'max_tokens' => $config['maxTokens'],
                    'top_p' => $config['topP'],
                    'stream' => true,
                ];

                $response = Http::timeout(60)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $config['apiKey'],
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