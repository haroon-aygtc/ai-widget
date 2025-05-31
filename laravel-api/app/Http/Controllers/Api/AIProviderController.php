<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIProvider;
use App\Services\AI\AIServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AIProviderController extends Controller
{
    /**
     * Get all available AI providers with their configurations
     */
    public function index(): JsonResponse
    {
        try {
            $providers = AIProvider::all();
            $availableTypes = AIServiceFactory::getAvailableProviders();

            // Add default settings for each provider
            foreach ($providers as $key => &$provider) {
                $provider['default_settings'] = [
                    'temperature' => 0.7,
                    'max_tokens' => 2048,
                    'system_prompt' => 'You are a helpful assistant.',
                    'stream_response' => true,
                    'context_window' => 4096,
                    'top_p' => 0.95,
                ];
                $provider['default_model'] = $provider['models'][0] ?? 'default-model';
                $provider['available_models'] = $provider['models'];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'configured_providers' => $providers,
                    'available_types' => $availableTypes
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch AI providers', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch AI providers'
            ], 500);
        }
    }

    /**
     * Update or create AI provider configuration
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'provider_type' => 'required|string',
                'name' => 'required|string',
                'api_key' => 'required|string',
                'model' => 'required|string',
                'temperature' => 'numeric|min:0|max:2',
                'max_tokens' => 'integer|min:1|max:32000',
                'system_prompt' => 'nullable|string',
                'advanced_settings' => 'nullable|array',
                'is_active' => 'boolean'
            ]);

            // Get the authenticated user (for now, use first user)
            $userId = auth()->id() ?? 1;

            $provider = AIProvider::updateOrCreate(
                [
                    'user_id' => $userId,
                    'provider_type' => $validated['provider_type']
                ],
                array_merge($validated, ['user_id' => $userId])
            );

            return response()->json([
                'success' => true,
                'data' => $provider,
                'message' => 'AI Provider configured successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to store AI provider', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save AI provider configuration'
            ], 500);
        }
    }

    /**
     * Test AI provider connection
     */
    public function testConnection(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'provider_type' => 'required|string',
                'api_key' => 'required|string',
                'model' => 'nullable|string',
                'temperature' => 'nullable|numeric',
                'max_tokens' => 'nullable|integer'
            ]);

            // Clean the API key - remove any "Bearer " prefix if accidentally included
            $apiKey = trim(preg_replace('/^Bearer\s+/i', '', $validated['api_key']));

            // Create a temporary provider instance for testing
            $tempProvider = new AIProvider([
                'provider_type' => $validated['provider_type'],
                'api_key' => $apiKey,
                'model' => $validated['model'] ?? 'temp',
                'temperature' => $validated['temperature'] ?? 0.7,
                'max_tokens' => $validated['max_tokens'] ?? 2048,
                'system_prompt' => 'You are a helpful assistant.',
                'advanced_settings' => $this->getDefaultAdvancedSettings($validated['provider_type'])
            ]);

            \Log::info('Testing connection for provider', [
                'provider_type' => $validated['provider_type'],
                'model' => $tempProvider->model,
                'api_key_length' => strlen($apiKey),
                'api_key_starts_with' => substr($apiKey, 0, 5) . '...'
            ]);

            $service = AIServiceFactory::create($tempProvider);
            $result = $service->testConnection([]);

            \Log::info('Connection test result', [
                'success' => $result['success'],
                'message' => $result['message'] ?? 'No message',
                'provider_type' => $validated['provider_type']
            ]);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['message'] ?? ($result['success'] ? 'Connection successful' : 'Connection failed')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for connection test', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Connection test failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'provider_type' => $request->input('provider_type')
            ]);

            $errorMessage = $e->getMessage();
            $providerSpecificMessage = '';

            // Add provider-specific error messages
            if ($request->input('provider_type') === 'claude' &&
                (strpos($errorMessage, 'invalid x-api-key') !== false ||
                 strpos($errorMessage, 'authentication') !== false)) {
                $providerSpecificMessage = 'Invalid API key format for Claude. Please ensure you\'re using the correct key from your Anthropic account.';
            } elseif ($request->input('provider_type') === 'openai' &&
                      strpos($errorMessage, '401') !== false) {
                $providerSpecificMessage = 'Invalid API key for OpenAI. Please check your API key.';
            } elseif ($request->input('provider_type') === 'groq' &&
                      strpos($errorMessage, 'invalid_api_key') !== false) {
                $providerSpecificMessage = 'Invalid API key for Groq. Please make sure you\'re using a valid API key (should start with "gsk_").';
            }

            // Append provider specific message if we have one
            $finalMessage = 'Connection test failed: ' . $e->getMessage();
            if (!empty($providerSpecificMessage)) {
                $finalMessage .= ' - ' . $providerSpecificMessage;
            }

            return response()->json([
                'success' => false,
                'message' => $finalMessage
            ], 400);
        }
    }

    /**
     * Get available models for a provider
     */
    public function getModels(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'provider_type' => 'required|string',
                'api_key' => 'required|string'
            ]);

            $result = AIServiceFactory::getAvailableModels(
                $validated['provider_type'],
                $validated['api_key']
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'provider' => $validated['provider_type'],
                    'models' => $result['models']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get models for provider', [
                'error' => $e->getMessage(),
                'provider_type' => $request->input('provider_type')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch models'
            ], 500);
        }
    }

    /**
     * Toggle provider active status
     */
    public function toggleStatus(AIProvider $provider): JsonResponse
    {
        try {
            $provider->update(['is_active' => !$provider->is_active]);

            return response()->json([
                'success' => true,
                'data' => $provider,
                'message' => 'Provider status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to toggle provider status', [
                'error' => $e->getMessage(),
                'provider_id' => $provider->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update provider status'
            ], 500);
        }
    }

    /**
     * Delete a provider configuration
     */
    public function destroy(AIProvider $provider): JsonResponse
    {
        try {
            $provider->delete();

            return response()->json([
                'success' => true,
                'message' => 'Provider deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete provider', [
                'error' => $e->getMessage(),
                'provider_id' => $provider->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete provider'
            ], 500);
        }
    }



    /**
     * Get default advanced settings for a provider type
     */
    private function getDefaultAdvancedSettings(string $type): array
    {
        return match ($type) {
            'claude' => ['top_p' => 1.0, 'top_k' => 5],
            'gemini' => ['top_p' => 0.9, 'top_k' => 40],
            'mistral' => ['top_p' => 1.0],
            'groq' => ['top_p' => 1.0],
            'deepseek' => ['top_p' => 1.0],
            'huggingface' => ['top_p' => 0.9, 'top_k' => 50],
            'grok' => ['top_p' => 1.0],
            'openrouter' => ['top_p' => 1.0],
            'openai' => [
                'top_p' => 0.95,
                'frequency_penalty' => 0,
                'presence_penalty' => 0,
            ],
            default => []
        };
    }
}
