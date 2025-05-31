<?php

namespace App\Services\AI;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class GeminiService
{
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    protected array $defaultConfig = [
        'model' => 'gemini-1.5-flash',
        'temperature' => 0.7,
        'maxTokens' => 2048,
        'topP' => 0.9,
        'topK' => 40,
    ];

    /**
     * Generate response from Gemini API.
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
                throw new \Exception('Gemini API key is required');
            }

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $this->buildPrompt($message, $config)]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => $config['temperature'],
                    'maxOutputTokens' => $config['maxTokens'],
                    'topP' => $config['topP'],
                    'topK' => $config['topK'],
                ]
            ];

            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post(
                    $this->baseUrl . '/models/' . $config['model'] . ':generateContent?key=' . $config['apiKey'],
                    $payload
                );

            if (!$response->successful()) {
                throw new \Exception('Gemini API error: ' . $response->body());
            }

            $data = $response->json();

            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('Invalid response format from Gemini API');
            }

            $responseTime = microtime(true) - $startTime;
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'];

            return [
                'success' => true,
                'response' => $responseText,
                'model' => $config['model'],
                'response_time' => $responseTime,
                'token_usage' => [
                    'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? null,
                    'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? null,
                    'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? null,
                ],
                'finish_reason' => $data['candidates'][0]['finishReason'] ?? 'stop'
            ];
        } catch (\Exception $e) {
            Log::error('Gemini API Error', [
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
     * Test connection to Gemini API.
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
                'provider' => 'gemini',
                'model' => $config['model'] ?? $this->defaultConfig['model'],
                'response_time' => $result['response_time'] ?? null
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'provider' => 'gemini'
            ];
        }
    }

    /**
     * Stream response from Gemini API.
     *
     * @param string $message
     * @param array $config
     * @return StreamedResponse
     */
    public function streamResponse(string $message, array $config = []): StreamedResponse
    {
        return response()->stream(function () use ($message, $config) {
            try {
                $result = $this->generateResponse($message, $config);

                if ($result['success']) {
                    // Simulate streaming by chunking the response
                    $chunks = str_split($result['response'], 10);
                    foreach ($chunks as $chunk) {
                        echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                        ob_flush();
                        flush();
                        usleep(50000); // 50ms delay
                    }
                    echo "data: [DONE]\n\n";
                } else {
                    echo "data: " . json_encode(['error' => $result['message']]) . "\n\n";
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
     * Build prompt with system context.
     *
     * @param string $message
     * @param array $config
     * @return string
     */
    protected function buildPrompt(string $message, array $config): string
    {
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        return $systemPrompt . "\n\nUser: " . $message . "\n\nAssistant:";
    }

    /**
     * Get available models.
     *
     * @return array
     */
    public function getAvailableModels(): array
    {
        return [
            'gemini-1.5-flash' => 'Gemini 1.5 Flash',
            'gemini-1.5-pro' => 'Gemini 1.5 Pro',
            'gemini-1.0-pro' => 'Gemini 1.0 Pro',
        ];
    }
}