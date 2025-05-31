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
        $apiKey = $this->provider->api_key;
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
    public function streamResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('OPENAI_API_KEY');
        $model = $config['model'] ?? 'gpt-4o';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        $topP = $config['topP'] ?? 1.0;

        return response()->stream(function () use ($apiKey, $model, $message, $temperature, $maxTokens, $systemPrompt, $topP) {
            $curl = curl_init();

            $payload = json_encode([
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message]
                ],
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
            $apiKey = $config['apiKey'] ?? null;

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'openai'
                ];
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->get('https://api.openai.com/v1/models');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'provider' => 'openai',
                    'models' => array_map(function($model) {
                        return $model['id'];
                    }, $response->json()['data'] ?? [])
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['error']['message'] ?? 'Connection failed',
                    'provider' => 'openai'
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'openai'
            ];
        }
    }
}
