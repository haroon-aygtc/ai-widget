<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GroqService
{
    protected string $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    /**
     * Generate a response using Groq
     *
     * @param string $message
     * @param array $config
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('GROQ_API_KEY');
        $model = $config['model'] ?? 'llama3-70b-8192';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        
        if (!$apiKey) {
            throw new \Exception('Groq API key is required');
        }
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30) // Groq is known for speed
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
                    'provider' => 'groq'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'groq'
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
     * @param array $config
     * @return \Illuminate\Http\StreamedResponse
     */
    public function streamResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('GROQ_API_KEY');
        $model = $config['model'] ?? 'llama3-70b-8192';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        
        return response()->stream(function () use ($apiKey, $model, $message, $temperature, $maxTokens, $systemPrompt) {
            $curl = curl_init();
            
            $payload = json_encode([
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message]
                ],
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
            $apiKey = $config['apiKey'] ?? null;
            
            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'groq'
                ];
            }
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->get('https://api.groq.com/openai/v1/models');
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'provider' => 'groq',
                    'models' => array_map(function($model) {
                        return $model['id'];
                    }, $response->json()['data'] ?? [])
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['error']['message'] ?? 'Connection failed',
                    'provider' => 'groq'
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'groq'
            ];
        }
    }
}