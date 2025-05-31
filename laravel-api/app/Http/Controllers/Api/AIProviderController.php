<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIProvider;
use App\Services\AI\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AIProviderController extends Controller
{
    protected $aiService;
    
    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }
    
    /**
     * Display a listing of the resource.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $providers = AIProvider::where('user_id', Auth::id())->get();
        
        // Mask API keys for security
        $providers->each(function ($provider) {
            $provider->api_key = $this->maskApiKey($provider->api_key);
        });
        
        return response()->json($providers);
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
            'temperature' => 'numeric|min:0|max:1',
            'max_tokens' => 'integer|min:1',
            'system_prompt' => 'nullable|string',
            'advanced_settings' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $provider = new AIProvider();
        $provider->user_id = Auth::id();
        $provider->provider_type = $request->provider_type;
        $provider->api_key = $request->api_key;
        $provider->model = $request->model;
        $provider->temperature = $request->temperature ?? 0.7;
        $provider->max_tokens = $request->max_tokens ?? 2048;
        $provider->system_prompt = $request->system_prompt;
        $provider->advanced_settings = $request->advanced_settings;
        $provider->is_active = true;
        $provider->save();
        
        // Mask API key before returning
        $provider->api_key = $this->maskApiKey($provider->api_key);
        
        return response()->json($provider, 201);
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
            'provider_type' => 'string',
            'api_key' => 'string',
            'model' => 'string',
            'temperature' => 'numeric|min:0|max:1',
            'max_tokens' => 'integer|min:1',
            'system_prompt' => 'nullable|string',
            'advanced_settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Only update fields that are present in the request
        if ($request->has('provider_type')) $provider->provider_type = $request->provider_type;
        if ($request->has('api_key')) $provider->api_key = $request->api_key;
        if ($request->has('model')) $provider->model = $request->model;
        if ($request->has('temperature')) $provider->temperature = $request->temperature;
        if ($request->has('max_tokens')) $provider->max_tokens = $request->max_tokens;
        if ($request->has('system_prompt')) $provider->system_prompt = $request->system_prompt;
        if ($request->has('advanced_settings')) $provider->advanced_settings = $request->advanced_settings;
        if ($request->has('is_active')) $provider->is_active = $request->is_active;
        
        $provider->save();
        
        // Mask API key before returning
        $provider->api_key = $this->maskApiKey($provider->api_key);
        
        return response()->json($provider);
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
        
        return response()->json(null, 204);
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
            $result = $this->aiService->testConnection($request->provider, [
                'apiKey' => $request->apiKey,
            ]);
            
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
     * Generate a response from an AI provider
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\StreamedResponse
     */
    public function generateResponse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string',
            'message' => 'required|string',
            'apiKey' => 'required|string',
            'model' => 'nullable|string',
            'temperature' => 'nullable|numeric|min:0|max:1',
            'maxTokens' => 'nullable|integer|min:1',
            'systemPrompt' => 'nullable|string',
            'stream' => 'nullable|boolean',
            'advancedSettings' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $config = [
                'apiKey' => $request->apiKey,
                'model' => $request->model,
                'temperature' => $request->temperature,
                'maxTokens' => $request->maxTokens,
                'systemPrompt' => $request->systemPrompt,
            ];
            
            // Add any advanced settings
            if ($request->has('advancedSettings')) {
                $config = array_merge($config, $request->advancedSettings);
            }
            
            // Handle streaming if requested
            if ($request->stream) {
                return $this->aiService->processMessage($request->provider, $request->message, $config, true);
            }
            
            $result = $this->aiService->processMessage($request->provider, $request->message, $config);
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
     * Get available AI providers
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableProviders()
    {
        $providers = $this->aiService->getAvailableProviders();
        
        return response()->json([
            'providers' => $providers
        ]);
    }
    
    /**
     * Mask API key for security
     * 
     * @param string $apiKey
     * @return string
     */
    protected function maskApiKey(string $apiKey): string
    {
        if (strlen($apiKey) <= 8) {
            return '********';
        }
        
        $visibleChars = 4;
        $prefix = substr($apiKey, 0, $visibleChars);
        $suffix = substr($apiKey, -$visibleChars);
        $maskedLength = strlen($apiKey) - ($visibleChars * 2);
        $masked = str_repeat('*', $maskedLength);
        
        return $prefix . $masked . $suffix;
    }
}
