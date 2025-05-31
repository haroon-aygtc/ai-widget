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
        $apiKey = $this->provider->api_key;
        $model = $this->provider->model;
        $temperature = $this->provider->temperature;
        $maxTokens = $this->provider->max_tokens;
        $systemPrompt = $this->provider->system_prompt;

        if (!$apiKey) {
            throw new \Exception('Groq API key is required');
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
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'groq',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('Groq API error: ' . $e->getMessage());
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
        $apiKey = $this->provider->api_key;
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
            $result = $this->generateResponse('Hello, this is a test message.', []);

            return [
                'success' => $result['success'],
                'message' => $result['success'] ? 'Connection successful' : ($result['error'] ?? 'Connection failed'),
                'provider' => 'groq',
                'model' => $this->provider->model
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'groq'
            ];
        }
    }
}
