<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class HuggingFaceService
{
    protected string $apiUrl = 'https://api-inference.huggingface.co/models';
    
    /**
     * Generate a response using HuggingFace
     *
     * @param string $message
     * @param array $config
     * @return array
     * @throws \Exception
     */
    public function generateResponse(string $message, array $config = [])
    {
        // Extract configuration parameters
        $apiKey = $config['apiKey'] ?? env('HUGGINGFACE_API_KEY');
        $model = $config['model'] ?? 'meta-llama/Llama-2-70b-chat-hf';
        $temperature = $config['temperature'] ?? 0.7;
        $maxTokens = $config['maxTokens'] ?? 2048;
        $systemPrompt = $config['systemPrompt'] ?? 'You are a helpful assistant.';
        
        if (!$apiKey) {
            throw new \Exception('HuggingFace API key is required');
        }
        
        try {
            // Format the prompt based on the model
            $prompt = $this->formatPrompt($message, $systemPrompt, $model);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->retry(3, 1000)
            ->post("{$this->apiUrl}/{$model}", [
                'inputs' => $prompt,
                'parameters' => [
                    'temperature' => (float) $temperature,
                    'max_new_tokens' => (int) $maxTokens,
                    'return_full_text' => false
                ]
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // HuggingFace can return different response formats based on the model
                $responseText = '';
                if (isset($data[0]['generated_text'])) {
                    $responseText = $data[0]['generated_text'];
                } elseif (is_string($data)) {
                    $responseText = $data;
                }
                
                return [
                    'success' => true,
                    'response' => $responseText,
                    'model' => $model,
                    'usage' => [
                        'prompt_tokens' => strlen($prompt) / 4, // Rough estimation
                        'completion_tokens' => strlen($responseText) / 4, // Rough estimation
                        'total_tokens' => (strlen($prompt) / 4) + (strlen($responseText) / 4),
                    ],
                    'provider' => 'huggingface'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'huggingface'
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('HuggingFace API error: ' . $e->getMessage());
        }
    }
    
    /**
     * Format the prompt based on the model
     *
     * @param string $message
     * @param string $systemPrompt
     * @param string $model
     * @return string
     */
    protected function formatPrompt(string $message, string $systemPrompt, string $model): string
    {
        // Different models require different prompt formats
        if (strpos($model, 'llama') !== false) {
            // Llama format
            return "<s>[INST] <<SYS>>\n{$systemPrompt}\n<</SYS>>\n\n{$message} [/INST]";
        } elseif (strpos($model, 'mistral') !== false) {
            // Mistral format
            return "<s>[INST] {$systemPrompt}\n\n{$message} [/INST]";
        } elseif (strpos($model, 'falcon') !== false) {
            // Falcon format
            return "System: {$systemPrompt}\nUser: {$message}\nAssistant:";
        } else {
            // Default format
            return "{$systemPrompt}\n\nUser: {$message}\nAssistant:";
        }
    }
    
    /**
     * Test connection to HuggingFace
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
                    'provider' => 'huggingface'
                ];
            }
            
            // HuggingFace doesn't have a specific endpoint to list models or test connection
            // So we'll use a simple model info request
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])
            ->timeout(10)
            ->get('https://huggingface.co/api/models?filter=text-generation&sort=downloads&direction=-1&limit=10');
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'provider' => 'huggingface',
                    'models' => array_map(function($model) {
                        return $model['id'];
                    }, $response->json() ?? [])
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['error'] ?? 'Connection failed',
                    'provider' => 'huggingface'
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'huggingface'
            ];
        }
    }
}