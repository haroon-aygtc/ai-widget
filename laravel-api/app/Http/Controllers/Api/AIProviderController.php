<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIProvider;
use App\Services\AI\AIServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AIProviderController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
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
    {
        try {
            $providers = AIServiceFactory::getAvailableProviders();

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
                'providers' => $providers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available providers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
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
            ], 500);
        }
    }

    /**
     * Mask API key for security
     *
     * @param string $apiKey
     * @return string
     */
    private function maskApiKey(string $apiKey): string
    {
        if (strlen($apiKey) <= 8) {
            return str_repeat('*', strlen($apiKey));
        }

        return substr($apiKey, 0, 4) . str_repeat('*', strlen($apiKey) - 8) . substr($apiKey, -4);
    }
}