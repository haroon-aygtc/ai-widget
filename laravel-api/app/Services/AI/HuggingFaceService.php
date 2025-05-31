<?php

namespace App\Services\AI;

use App\Models\AIProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class HuggingFaceService
{
    protected string $apiUrl = 'https://api-inference.huggingface.co/models';
    protected AIProvider $provider;

    public function __construct(AIProvider $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate a response using HuggingFace
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
            throw new \Exception('HuggingFace API key is required');
        }

        try {
            // Format the prompt based on the model and context
            $prompt = $this->formatPrompt($message, $systemPrompt, $model, $context);

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
                    'content' => $responseText,
                    'model' => $model,
                    'usage' => [
                        'prompt_tokens' => strlen($prompt) / 4, // Rough estimation
                        'completion_tokens' => strlen($responseText) / 4, // Rough estimation
                        'total_tokens' => (strlen($prompt) / 4) + (strlen($responseText) / 4),
                    ],
                    'provider' => 'huggingface',
                    'provider_id' => $this->provider->id
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response->json()['error'] ?? 'Unknown error',
                    'status' => $response->status(),
                    'provider' => 'huggingface',
                    'provider_id' => $this->provider->id
                ];
            }
        } catch (RequestException $e) {
            throw new \Exception('HuggingFace API error: ' . $e->getMessage());
        }
    }

    /**
     * Format the prompt based on the model and context
     *
     * @param string $message
     * @param string $systemPrompt
     * @param string $model
     * @param array $context
     * @return string
     */
    protected function formatPrompt(string $message, string $systemPrompt, string $model, array $context): string
    {
        $prompt = '';

        // Different models require different prompt formats
        if (strpos($model, 'llama') !== false) {
            // Llama format
            $prompt = "<s>[INST] <<SYS>>\n{$systemPrompt}\n<</SYS>>\n\n";

            // Add conversation history
            if (!empty($context['conversation_history'])) {
                foreach ($context['conversation_history'] as $msg) {
                    if ($msg['role'] === 'user') {
                        $prompt .= $msg['content'] . " [/INST] ";
                    } else {
                        $prompt .= $msg['content'] . " </s><s>[INST] ";
                    }
                }
            }

            $prompt .= "{$message} [/INST]";
        } elseif (strpos($model, 'mistral') !== false) {
            // Mistral format
            $prompt = "<s>[INST] {$systemPrompt}\n\n";

            // Add conversation history
            if (!empty($context['conversation_history'])) {
                foreach ($context['conversation_history'] as $msg) {
                    if ($msg['role'] === 'user') {
                        $prompt .= $msg['content'] . " [/INST] ";
                    } else {
                        $prompt .= $msg['content'] . " </s><s>[INST] ";
                    }
                }
            }

            $prompt .= "{$message} [/INST]";
        } elseif (strpos($model, 'falcon') !== false) {
            // Falcon format
            $prompt = "System: {$systemPrompt}\n";

            // Add conversation history
            if (!empty($context['conversation_history'])) {
                foreach ($context['conversation_history'] as $msg) {
                    $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
                    $prompt .= "{$role}: {$msg['content']}\n";
                }
            }

            $prompt .= "User: {$message}\nAssistant:";
        } else {
            // Default format
            $prompt = "{$systemPrompt}\n\n";

            // Add conversation history
            if (!empty($context['conversation_history'])) {
                foreach ($context['conversation_history'] as $msg) {
                    $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
                    $prompt .= "{$role}: {$msg['content']}\n";
                }
            }

            $prompt .= "User: {$message}\nAssistant:";
        }

        return $prompt;
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
            $result = $this->generateResponse('Hello, this is a test message.', []);

            return [
                'success' => $result['success'],
                'message' => $result['success'] ? 'Connection successful' : ($result['error'] ?? 'Connection failed'),
                'provider' => 'huggingface',
                'model' => $this->provider->model
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
                'provider' => 'huggingface'
            ];
        }
    }
}
