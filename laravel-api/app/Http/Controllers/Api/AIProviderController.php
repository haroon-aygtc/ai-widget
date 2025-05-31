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
<<<<<<< HEAD
    public function index()
    {
        $providers = AIProvider::where('user_id', Auth::id())->get();

        // Mask API keys for security and add full API key for internal use
        $providers->each(function ($provider) {
            $provider->masked_api_key = $this->maskApiKey($provider->api_key);
            // Keep the full API key for backend operations but don't expose it
            $provider->makeHidden(['api_key']);
            $provider->setAttribute('api_key', $provider->masked_api_key);
        });

        return response()->json([
            'success' => true,
            'data' => $providers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider_type' => 'required|string',
            'api_key' => 'required|string',
            'model' => 'required|string',
            'temperature' => 'numeric|min:0|max:2',
            'max_tokens' => 'integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'stream_response' => 'boolean',
            'context_window' => 'integer|min:1',
            'top_p' => 'numeric|min:0|max:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if provider already exists for this user
        $existingProvider = AIProvider::where('user_id', Auth::id())
            ->where('provider_type', $request->provider_type)
            ->first();

        if ($existingProvider) {
            return response()->json([
                'message' => 'Provider already exists. Use update instead.',
                'provider_id' => $existingProvider->id
            ], 409);
        }

        $provider = new AIProvider();
        $provider->user_id = Auth::id();
        $provider->provider_type = $request->provider_type;
        $provider->api_key = $request->api_key;
        $provider->model = $request->model;
        $provider->temperature = $request->temperature ?? 0.7;
        $provider->max_tokens = $request->max_tokens ?? 2048;
        $provider->system_prompt = $request->system_prompt ?? 'You are a helpful assistant.';
        $provider->advanced_settings = [
            'stream_response' => $request->stream_response ?? true,
            'context_window' => $request->context_window ?? 4096,
            'top_p' => $request->top_p ?? 0.95,
        ];
        $provider->is_active = $request->is_active ?? true;
        $provider->save();

        // Mask API key before returning
        $provider->api_key = $this->maskApiKey($provider->api_key);

        return response()->json([
            'success' => true,
            'data' => $provider,
            'message' => 'AI Provider created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $provider = AIProvider::where('user_id', Auth::id())->findOrFail($id);

        // Mask API key for security
        $provider->api_key = $this->maskApiKey($provider->api_key);

        return response()->json($provider);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, string $id)
    {
        $provider = AIProvider::where('user_id', Auth::id())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'provider_type' => 'sometimes|string',
            'api_key' => 'sometimes|string',
            'model' => 'sometimes|string',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'max_tokens' => 'sometimes|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'stream_response' => 'sometimes|boolean',
            'context_window' => 'sometimes|integer|min:1',
            'top_p' => 'sometimes|numeric|min:0|max:1',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update fields
        if ($request->has('provider_type')) {
            $provider->provider_type = $request->provider_type;
        }
        if ($request->has('api_key')) {
            $provider->api_key = $request->api_key;
        }
        if ($request->has('model')) {
            $provider->model = $request->model;
        }
        if ($request->has('temperature')) {
            $provider->temperature = $request->temperature;
        }
        if ($request->has('max_tokens')) {
            $provider->max_tokens = $request->max_tokens;
        }
        if ($request->has('system_prompt')) {
            $provider->system_prompt = $request->system_prompt;
        }
        if ($request->has('is_active')) {
            $provider->is_active = $request->is_active;
        }

        // Update advanced settings
        $advancedSettings = $provider->advanced_settings ?? [];
        if ($request->has('stream_response')) {
            $advancedSettings['stream_response'] = $request->stream_response;
        }
        if ($request->has('context_window')) {
            $advancedSettings['context_window'] = $request->context_window;
        }
        if ($request->has('top_p')) {
            $advancedSettings['top_p'] = $request->top_p;
        }

        $provider->advanced_settings = $advancedSettings;
        $provider->save();

        // Mask API key before returning
        $provider->api_key = $this->maskApiKey($provider->api_key);

        return response()->json([
            'success' => true,
            'data' => $provider,
            'message' => 'AI Provider updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        $provider = AIProvider::where('user_id', Auth::id())->findOrFail($id);
        $provider->delete();

        return response()->json([
            'success' => true,
            'message' => 'AI Provider deleted successfully'
        ]);
    }

    /**
     * Test connection to an AI provider
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testConnection(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string',
            'apiKey' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $result = AIServiceFactory::testConnection($request->provider, $request->apiKey);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'provider' => $request->provider
            ], 500);
        }
    }

    /**
     * Get available AI providers with their configurations
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableProviders()
=======
    public function index(): JsonResponse
>>>>>>> 8b3f712db1b50e15e89947b386f4b2ed7f7e95bd
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
<<<<<<< HEAD
     * Get provider configuration by type
     *
     * @param string $providerType
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProviderConfig(string $providerType)
    {
        try {
            $providers = AIServiceFactory::getAvailableProviders();
            
            if (!isset($providers[$providerType])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider not found'
                ], 404);
            }

            $provider = $providers[$providerType];
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

            return response()->json([
                'success' => true,
                'provider' => $provider
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch provider configuration',
                'error' => $e->getMessage()
=======
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
>>>>>>> 8b3f712db1b50e15e89947b386f4b2ed7f7e95bd
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

            // Create a temporary provider instance for testing
            $tempProvider = new AIProvider([
                'provider_type' => $validated['provider_type'],
                'api_key' => $validated['api_key'],
                'model' => $validated['model'] ?? $this->getDefaultModel($validated['provider_type']),
                'temperature' => $validated['temperature'] ?? 0.7,
                'max_tokens' => $validated['max_tokens'] ?? 2048,
                'system_prompt' => 'You are a helpful assistant.',
                'advanced_settings' => $this->getDefaultAdvancedSettings($validated['provider_type'])
            ]);

            $service = AIServiceFactory::create($tempProvider);
            $result = $service->testConnection([]);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['message'] ?? ($result['success'] ? 'Connection successful' : 'Connection failed')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Connection test failed', [
                'error' => $e->getMessage(),
                'provider_type' => $request->input('provider_type')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get available models for a provider
     */
    public function getModels(string $providerType): JsonResponse
    {
        try {
            $availableProviders = AIServiceFactory::getAvailableProviders();

            if (!isset($availableProviders[$providerType])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'provider' => $providerType,
                    'models' => $availableProviders[$providerType]['models']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get models for provider', [
                'error' => $e->getMessage(),
                'provider_type' => $providerType
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
     * Get default model for a provider type
     */
    private function getDefaultModel(string $type): string
    {
        return match ($type) {
            'openai' => 'gpt-4o',
            'claude' => 'claude-3-sonnet-20240229',
            'gemini' => 'gemini-1.5-pro',
            'mistral' => 'mistral-large-latest',
            'groq' => 'llama3-70b-8192',
            'deepseek' => 'deepseek-chat',
            'huggingface' => 'meta-llama/Llama-2-70b-chat-hf',
            'grok' => 'grok-1',
            'openrouter' => 'openai/gpt-4o',
            default => 'gpt-4o'
        };
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