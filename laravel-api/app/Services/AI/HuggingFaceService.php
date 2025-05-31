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
        $apiKey = $this->provider->getRawApiKey();
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

            \Log::debug('HuggingFace API request', [
                'model' => $model,
                'prompt_length' => strlen($prompt),
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 6) . '...'
            ]);

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
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'Unknown error';

                \Log::error('HuggingFace API error response', [
                    'status' => $response->status(),
                    'error_message' => $errorMessage,
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => $errorMessage,
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
            $apiKey = $this->provider->getRawApiKey();

            if (!$apiKey) {
                return [
                    'success' => false,
                    'message' => 'API key is required',
                    'provider' => 'huggingface'
                ];
            }

            \Log::info('Testing HuggingFace API connection', [
                'model' => $this->provider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_prefix' => substr($apiKey, 0, 6) . '...'
            ]);

            $result = $this->generateResponse('Hello, this is a test message.', []);

            if (!$result['success']) {
                $errorMessage = $result['error'] ?? 'Connection failed';

                // Provide more helpful error messages
                if (isset($result['status']) && $result['status'] === 401) {
                    $errorMessage = 'Authentication failed. Please check your HuggingFace API key';
                }

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'provider' => 'huggingface',
                    'model' => $this->provider->model,
                    'details' => $result
                ];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'provider' => 'huggingface',
                'model' => $this->provider->model,
                'response_content' => substr($result['content'] ?? '', 0, 50) . '...'
            ];
        } catch (\Exception $e) {
            \Log::error('HuggingFace API connection test failed', [
                'error' => $e->getMessage(),
                'model' => $this->provider->model
            ]);

            $errorMessage = $e->getMessage();

            // Improve error message for common issues
            if (stripos($errorMessage, '401') !== false || stripos($errorMessage, 'unauthorized') !== false) {
                $errorMessage = 'Authentication failed. Please check your HuggingFace API key';
            }

            return [
                'success' => false,
                'message' => 'Connection error: ' . $errorMessage,
                'provider' => 'huggingface'
            ];
        }
    }

    /**
     * Get available models from HuggingFace API
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

            // Try to validate API key by testing a known model
            $testResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($this->apiUrl . '/microsoft/DialoGPT-medium', [
                'inputs' => 'test',
                'parameters' => [
                    'max_new_tokens' => 1,
                    'return_full_text' => false
                ]
            ]);

            if ($testResponse->successful() || $testResponse->status() === 503) {
                // API key is valid (503 means model is loading, which is normal)
                $models = [
                    [
                        'id' => 'microsoft/DialoGPT-medium',
                        'name' => 'DialoGPT Medium',
                        'description' => 'Conversational AI model'
                    ],
                    [
                        'id' => 'microsoft/DialoGPT-large',
                        'name' => 'DialoGPT Large',
                        'description' => 'Large conversational AI model'
                    ],
                    [
                        'id' => 'facebook/blenderbot-400M-distill',
                        'name' => 'BlenderBot 400M',
                        'description' => 'Conversational AI model'
                    ],
                    [
                        'id' => 'microsoft/GODEL-v1_1-large-seq2seq',
                        'name' => 'GODEL Large',
                        'description' => 'Goal-oriented dialog model'
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to validate API key with HuggingFace',
                    'models' => []
                ];
            }

            return [
                'success' => true,
                'models' => $models
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'models' => []
            ];
        }
    }
}
