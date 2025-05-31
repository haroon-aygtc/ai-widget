<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\StreamedResponse;

class GeminiService
{
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate response from Gemini API.
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
            $topP = $advancedSettings['top_p'] ?? 0.9;
            $topK = $advancedSettings['top_k'] ?? 40;

            if (!$apiKey) {
                throw new \Exception('Gemini API key is required');
            }

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $this->buildPrompt($message, $systemPrompt, $context)]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => $temperature,
                    'maxOutputTokens' => $maxTokens,
                    'topP' => $topP,
                    'topK' => $topK,
                ]
            ];

            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post(
                    $this->baseUrl . '/models/' . $model . ':generateContent?key=' . $apiKey,
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
                'content' => $responseText,
                'model' => $model,
                'response_time' => $responseTime,
                'usage' => [
                    'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? null,
                    'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? null,
                    'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? null,
                ],
                'finish_reason' => $data['candidates'][0]['finishReason'] ?? 'stop',
                'provider' => 'gemini',
                'provider_id' => $this->provider->id
            ];
        } catch (\Exception $e) {
            Log::error('Gemini API Error', [
                'message' => $e->getMessage(),
                'provider_id' => $this->provider->id
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'response_time' => microtime(true) - $startTime,
                'provider' => 'gemini',
                'provider_id' => $this->provider->id
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
            $apiKey = $this->provider->getRawApiKey();

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'gemini'
                ];
            }

            \Log::info('Testing Gemini API connection', [
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
                    'provider' => 'gemini',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'gemini',
                'model' => $this->provider->model,
                'response_time' => $result['response_time'] ?? null,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('Gemini API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your Gemini API key';
            }

            return [
                'success' => false,
                'message' => 'Connection error: ' . $errorMessage,
                'provider' => 'gemini'
            ];
        }
    }

    /**
     * Stream response from Gemini API.
     *
     * @param string $message
     * @param array $context
     * @return StreamedResponse
     */
    public function streamResponse(string $message, array $context = []): StreamedResponse
    {
        return response()->stream(function () use ($message, $context) {
            try {
                $result = $this->generateResponse($message, $context);

                if ($result['success']) {
                    // Simulate streaming by chunking the response
                    $chunks = str_split($result['content'], 10);
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
     * Build prompt with system context and conversation history.
     *
     * @param string $message
     * @param string $systemPrompt
     * @param array $context
     * @return string
     */
    protected function buildPrompt(string $message, string $systemPrompt, array $context): string
    {
        $prompt = $systemPrompt . "\n\n";

        // Add conversation history if provided
        if (!empty($context['conversation_history'])) {
            foreach ($context['conversation_history'] as $msg) {
                $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
                $prompt .= $role . ": " . $msg['content'] . "\n";
            }
        }

        $prompt .= "User: " . $message . "\n\nAssistant:";
        return $prompt;
    }

    /**
     * Get available models from Gemini API
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

            $response = Http::timeout(10)
                ->get($this->baseUrl . '/models?key=' . $apiKey);

            if ($response->successful()) {
                $data = $response->json();
                $models = [];

                foreach ($data['models'] as $model) {
                    $models[] = [
                        'id' => str_replace('models/', '', $model['name']),
                        'name' => str_replace('models/', '', $model['name']),
                        'description' => $model['description'] ?? 'Gemini model'
                    ];
                }

                return [
                    'success' => true,
                    'models' => $models
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to fetch models',
                    'models' => []
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'models' => []
            ];
        }
    }
}
