<?php

namespace App\Services\AI;

use App\Models\AIModel;
use App\Models\AIProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AIModelService
{
    // No longer needs dependency injection - uses static factory methods

    /**
     * Fetch available models from a provider
     *
     * @param string $provider
     * @param string $apiKey
     * @return array
     */
    public function fetchAvailableModels(string $provider, string $apiKey): array
    {
        $cacheKey = "models_{$provider}_" . md5($apiKey);

        // Check cache first (cache for 1 hour)
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            // Use default models for now - individual providers can be enhanced later
            $models = $this->getDefaultModelsForProvider($provider);

            // Cache the results
            Cache::put($cacheKey, $models, 3600);

            return $models;

        } catch (\Exception $e) {
            Log::error('Error fetching models', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'models' => []
            ];
        }
    }

    /**
     * Test a specific model with a sample prompt
     *
     * @param string $provider
     * @param string $modelId
     * @param array $config
     * @return array
     */
    public function testModel(string $provider, string $modelId, array $config): array
    {
        try {
            // Create a temporary provider for testing
            $tempProvider = new AIProvider([
                'provider_type' => $provider,
                'api_key' => $config['apiKey'] ?? '',
                'model' => $modelId,
                'temperature' => $config['temperature'] ?? 0.7,
                'max_tokens' => $config['maxTokens'] ?? 100,
            ]);

            $providerService = AIServiceFactory::create($tempProvider);

            // Use a simple test prompt
            $testPrompt = 'Respond with a short greeting.';

            $startTime = microtime(true);
            $response = $providerService->generateResponse($testPrompt, []);
            $endTime = microtime(true);

            // Calculate response time in milliseconds
            $responseTime = round(($endTime - $startTime) * 1000);

            return [
                'success' => $response['success'] ?? false,
                'message' => $response['success'] ? 'Model test successful' : 'Model test failed',
                'provider' => $provider,
                'model' => $modelId,
                'response' => $response['content'] ?? null,
                'metrics' => [
                    'responseTime' => $responseTime,
                    'tokenUsage' => $response['usage'] ?? null
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'provider' => $provider,
                'model' => $modelId
            ];
        }
    }

    /**
     * Get default models for providers without API-based model fetching
     *
     * @param string $provider
     * @return array
     */
    protected function getDefaultModelsForProvider(string $provider): array
    {
        $defaultModels = [
            'openai' => [
                ['id' => 'gpt-4o', 'name' => 'GPT-4o', 'description' => 'Most capable model for complex tasks'],
                ['id' => 'gpt-4-turbo', 'name' => 'GPT-4 Turbo', 'description' => 'High performance model with 128k context'],
                ['id' => 'gpt-3.5-turbo', 'name' => 'GPT-3.5 Turbo', 'description' => 'Fast and efficient model for most tasks']
            ],
            'gemini' => [
                ['id' => 'gemini-1.5-pro', 'name' => 'Gemini 1.5 Pro', 'description' => 'Most capable Gemini model'],
                ['id' => 'gemini-1.5-flash', 'name' => 'Gemini 1.5 Flash', 'description' => 'Fast and efficient Gemini model']
            ],
            'claude' => [
                ['id' => 'claude-3-opus', 'name' => 'Claude 3 Opus', 'description' => 'Most powerful Claude model'],
                ['id' => 'claude-3-sonnet', 'name' => 'Claude 3 Sonnet', 'description' => 'Balanced Claude model'],
                ['id' => 'claude-3-haiku', 'name' => 'Claude 3 Haiku', 'description' => 'Fast and efficient Claude model']
            ],
            'mistral' => [
                ['id' => 'mistral-large', 'name' => 'Mistral Large', 'description' => 'Most capable Mistral model'],
                ['id' => 'mistral-medium', 'name' => 'Mistral Medium', 'description' => 'Balanced Mistral model'],
                ['id' => 'mistral-small', 'name' => 'Mistral Small', 'description' => 'Fast and efficient Mistral model']
            ],
            'grok' => [
                ['id' => 'grok-1', 'name' => 'Grok-1', 'description' => 'Grok conversational AI model']
            ],
            'groq' => [
                ['id' => 'llama3-70b-8192', 'name' => 'LLaMA-3 70B', 'description' => 'LLaMA 3 70B model via Groq'],
                ['id' => 'llama3-8b-8192', 'name' => 'LLaMA-3 8B', 'description' => 'LLaMA 3 8B model via Groq'],
                ['id' => 'mixtral-8x7b-32768', 'name' => 'Mixtral 8x7B', 'description' => 'Mixtral model via Groq']
            ],
            'openrouter' => [
                ['id' => 'openai/gpt-4o', 'name' => 'GPT-4o (OpenRouter)', 'description' => 'OpenAI GPT-4o via OpenRouter'],
                ['id' => 'anthropic/claude-3-opus', 'name' => 'Claude 3 Opus (OpenRouter)', 'description' => 'Anthropic Claude 3 Opus via OpenRouter'],
                ['id' => 'meta-llama/llama-3-70b-instruct', 'name' => 'LLaMA 3 70B (OpenRouter)', 'description' => 'Meta LLaMA 3 70B via OpenRouter']
            ],
            'deepseek' => [
                ['id' => 'deepseek-coder', 'name' => 'DeepSeek Coder', 'description' => 'Specialized for code generation'],
                ['id' => 'deepseek-chat', 'name' => 'DeepSeek Chat', 'description' => 'General purpose chat model']
            ],
            'huggingface' => [
                ['id' => 'meta-llama/Llama-2-70b-chat-hf', 'name' => 'LLaMA 2 70B', 'description' => 'Meta LLaMA 2 70B model'],
                ['id' => 'mistralai/Mistral-7B-Instruct-v0.2', 'name' => 'Mistral 7B', 'description' => 'Mistral 7B instruction-tuned model']
            ]
        ];

        return [
            'success' => true,
            'provider' => $provider,
            'models' => $defaultModels[$provider] ?? []
        ];
    }

    /**
     * Update model performance metrics
     *
     * @param AIModel $model
     * @param array $metrics
     * @return AIModel
     */
    public function updateModelMetrics(AIModel $model, array $metrics): AIModel
    {
        $currentMetrics = $model->performance_metrics ?? [];

        // Merge new metrics with existing ones
        $updatedMetrics = array_merge($currentMetrics, $metrics);

        // Update usage counts
        $updatedMetrics['usage_count'] = ($currentMetrics['usage_count'] ?? 0) + 1;

        // Calculate average response time
        if (isset($metrics['responseTime'])) {
            $totalTime = ($currentMetrics['total_response_time'] ?? 0) + $metrics['responseTime'];
            $updatedMetrics['total_response_time'] = $totalTime;
            $updatedMetrics['avg_response_time'] = $totalTime / $updatedMetrics['usage_count'];
        }

        // Update token usage statistics
        if (isset($metrics['tokenUsage'])) {
            $updatedMetrics['total_tokens'] = ($currentMetrics['total_tokens'] ?? 0) +
                ($metrics['tokenUsage']['total_tokens'] ?? 0);
        }

        // Update the model
        $model->performance_metrics = $updatedMetrics;
        $model->save();

        return $model;
    }
}
