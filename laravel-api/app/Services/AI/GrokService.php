<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GrokService
{
    protected string $apiUrl = 'https://api.x.ai/v1/chat/completions';
    
    /**
     * Generate a response using Grok (X.AI)
     *
     * @param string $message
     * @param array $config
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('GROK_API_KEY');
        $model = $config['model'] ?? 'grok-1';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        
        if (!$apiKey) {
            throw new \Exception('Grok API key is required');
        }
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
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
                    'provider' => 'grok'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'grok'
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
            $apiKey = $config['apiKey'] ?? null;
            
            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'grok'
                ];
            }
            
            // Send a simple request to test the connection
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($this->apiUrl, [
                'model' => 'grok-1',
                'messages' => [
                    ['role' => 'user', 'content' => 'Hello']
                ],
                'max_tokens' => 5
            ]);
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'provider' => 'grok',
                    'models' => ['grok-1']
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['error']['message'] ?? 'Connection failed',
                    'provider' => 'grok'
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'grok'
            ];
        }
    }
}