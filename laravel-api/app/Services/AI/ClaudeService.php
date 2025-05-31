<?php

namespace App\Services\AI;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class ClaudeService
{
    protected string $baseUrl = 'https://api.anthropic.com/v1';
    protected array $defaultConfig = [
        'model' => 'claude-3-haiku-20240307',
        'temperature' => 0.7,
        'maxTokens' => 2048,
        'topP' => 1.0,
        'topK' => 5,
    ];

    /**
     * Generate response from Claude API.
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
                throw new \Exception('Claude API key is required');
            }

            $payload = [
                'model' => $config['model'],
                'max_tokens' => $config['maxTokens'],
                'temperature' => $config['temperature'],
                'top_p' => $config['topP'],
                'top_k' => $config['topK'],
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $message
                    ]
                ]
            ];

            // Add system prompt if provided
            if (!empty($config['systemPrompt'])) {
                $payload['system'] = $config['systemPrompt'];
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'x-api-key' => $config['apiKey'],
                    'Content-Type' => 'application/json',
                    'anthropic-version' => '2023-06-01',
                ])
                ->post($this->baseUrl . '/messages', $payload);

            if (!$response->successful()) {
                throw new \Exception('Claude API error: ' . $response->body());
            }

            $data = $response->json();

            if (!isset($data['content'][0]['text'])) {
                throw new \Exception('Invalid response format from Claude API');
            }

            $responseTime = microtime(true) - $startTime;
            $responseText = $data['content'][0]['text'];

            return [
                'success' => true,
                'response' => $responseText,
                'model' => $data['model'] ?? $config['model'],
                'response_time' => $responseTime,
                'token_usage' => [
                    'prompt_tokens' => $data['usage']['input_tokens'] ?? null,
                    'completion_tokens' => $data['usage']['output_tokens'] ?? null,
                    'total_tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
                ],
                'finish_reason' => $data['stop_reason'] ?? 'end_turn'
            ];
        } catch (\Exception $e) {
            Log::error('Claude API Error', [
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
     * Test connection to Claude API.
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
                'provider' => 'claude',
                'model' => $config['model'] ?? $this->defaultConfig['model'],
                'response_time' => $result['response_time'] ?? null
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'provider' => 'claude'
            ];
        }
    }

    /**
     * Stream response from Claude API.
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
                    throw new \Exception('Claude API key is required');
                }

                $payload = [
                    'model' => $config['model'],
                    'max_tokens' => $config['maxTokens'],
                    'temperature' => $config['temperature'],
                    'top_p' => $config['topP'],
                    'top_k' => $config['topK'],
                    'stream' => true,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $message
                        ]
                    ]
                ];

                // Add system prompt if provided
                if (!empty($config['systemPrompt'])) {
                    $payload['system'] = $config['systemPrompt'];
                }

                $response = Http::timeout(60)
                    ->withHeaders([
                        'x-api-key' => $config['apiKey'],
                        'Content-Type' => 'application/json',
                        'anthropic-version' => '2023-06-01',
                    ])
                    ->post($this->baseUrl . '/messages', $payload);

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
            'claude-3-haiku-20240307' => 'Claude 3 Haiku',
            'claude-3-sonnet-20240229' => 'Claude 3 Sonnet',
            'claude-3-opus-20240229' => 'Claude 3 Opus',
            'claude-3-5-sonnet-20241022' => 'Claude 3.5 Sonnet',
        ];
    }
}