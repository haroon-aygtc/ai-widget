<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class OpenRouterService
{
    protected string $apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    /**
     * Generate a response using OpenRouter
     *
     * @param string $message
     * @param array $config
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('OPENROUTER_API_KEY');
        $model = $config['model'] ?? 'openai/gpt-4o';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        
        if (!$apiKey) {
            throw new \Exception('OpenRouter API key is required');
        }
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url'), // Required by OpenRouter
                'X-Title' => config('app.name') // Required by OpenRouter
            ])
            ->timeout(60)
            ->retry(3, 1000)
            ->post($this->apiUrl, [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message]
                ],
                'temperature' => (float) $temperature,
                'max_tokens' => (int) $maxTokens,
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'response' => $data['choices'][0]['message']['content'] ?? '',
                    'model' => $data['model'] ?? $model,
                    'usage' => $data['usage'] ?? [
                        'prompt_tokens' => 0,
                        'completion_tokens' => 0,
                        'total_tokens' => 0,
                    ],
                    'id' => $data['id'] ?? null,
                    'created' => $data['created'] ?? time(),
                    'provider' => 'openrouter'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'openrouter'
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('OpenRouter API error: ' . $e->getMessage());
        }
    }
    
    /**
     * Test connection to OpenRouter
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
                    'provider' => 'openrouter'
                ];
            }
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name')
            ])
            ->timeout(10)
            ->get('https://openrouter.ai/api/v1/models');
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'provider' => 'openrouter',
                    'models' => array_map(function($model) {
                        return $model['id'];
                    }, $response->json()['data'] ?? [])
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['error']['message'] ?? 'Connection failed',
                    'provider' => 'openrouter'
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'openrouter'
            ];
        }
    }
}