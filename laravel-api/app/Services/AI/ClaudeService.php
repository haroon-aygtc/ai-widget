<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class ClaudeService
{
    protected string $baseUrl = 'https://api.anthropic.com/v1';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate response from Claude API.
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
            $topK = $advancedSettings['top_k'] ?? 5;

            if (!$apiKey) {
                throw new \Exception('Claude API key is required');
            }

            // Build messages array with context
            $messages = [];

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
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'top_p' => $topP,
                'top_k' => $topK,
                'messages' => $messages
            ];

            // Add system prompt if provided
            if (!empty($systemPrompt)) {
                $payload['system'] = $systemPrompt;
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'x-api-key' => $apiKey,
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
                'content' => $responseText,
                'model' => $data['model'] ?? $model,
                'response_time' => $responseTime,
                'usage' => [
                    'prompt_tokens' => $data['usage']['input_tokens'] ?? null,
                    'completion_tokens' => $data['usage']['output_tokens'] ?? null,
                    'total_tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
                ],
                'finish_reason' => $data['stop_reason'] ?? 'end_turn',
                'provider' => 'claude',
                'provider_id' => $this->provider->id
            ];
        } catch (\Exception $e) {
            Log::error('Claude API Error', [
                'message' => $e->getMessage(),
                'provider_id' => $this->provider->id
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'response_time' => microtime(true) - $startTime,
                'provider' => 'claude',
                'provider_id' => $this->provider->id
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
            $result = $this->generateResponse('Hello, this is a test message.', []);

            return [
                'success' => $result['success'],
                'message' => $result['success'] ? 'Connection successful' : $result['message'],
                'provider' => 'claude',
                'model' => $this->provider->model,
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
                $topK = $advancedSettings['top_k'] ?? 5;

                if (!$apiKey) {
                    throw new \Exception('Claude API key is required');
                }

                // Build messages array with context
                $messages = [];

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
                    'max_tokens' => $maxTokens,
                    'temperature' => $temperature,
                    'top_p' => $topP,
                    'top_k' => $topK,
                    'stream' => true,
                    'messages' => $messages
                ];

                // Add system prompt if provided
                if (!empty($systemPrompt)) {
                    $payload['system'] = $systemPrompt;
                }

                $response = Http::timeout(60)
                    ->withHeaders([
                        'x-api-key' => $apiKey,
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
