<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GrokService
{
    protected string $apiUrl = 'https://api.x.ai/v1/chat/completions';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate a response using Grok (X.AI)
     *
     * @param string $message
     * @param array $context
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $context = [])
    {
        // Use provider configuration
        $apiKey = $this->provider->api_key;
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;

        if (!$apiKey) {
            throw new \Exception('Grok API key is required');
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
                    'provider' => 'grok',
                    'provider_id' => $this->provider->id
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'grok',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('Grok API error: ' . $e->getMessage());
        }
    }

    /**
     * Test connection to Grok
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
                'message' => $result['success'] ? 'Connection successful' : ($result['error'] ?? 'Connection failed'),
                'provider' => 'grok',
                'model' => $this->provider->model
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'grok'
            ];
        }
    }
}
