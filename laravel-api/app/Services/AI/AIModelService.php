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
     * Get available models for a provider
     *
     * @param string $provider
     * @param array $config
     * @return array
     */
    public function getAvailableModels(string $provider, array $config = []): array
    {
        try {
            return AIServiceFactory::getAvailableModels($provider, $config['apiKey'] ?? '');
        } catch (\Exception $e) {
            \Log::error('Failed to get available models', [
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
