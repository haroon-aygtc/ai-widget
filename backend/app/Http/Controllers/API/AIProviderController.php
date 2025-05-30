<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AIProvider;
use App\Services\AI\AIService;
use Illuminate\Http\Request;

class AIProviderController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Display a listing of the AI providers.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $providers = AIProvider::where('user_id', auth()->id())->get();
        return response()->json($providers);
    }

    /**
     * Store a newly created AI provider in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'apiKey' => 'required|string',
            'model' => 'required|string',
            'temperature' => 'required|numeric|min:0|max:1',
            'maxTokens' => 'required|integer|min:1',
            'systemPrompt' => 'nullable|string',
            'advancedSettings' => 'nullable|array',
        ]);

        $provider = AIProvider::create([
            'user_id' => auth()->id(),
            'provider_type' => $validated['provider'],
            'api_key' => encrypt($validated['apiKey']),
            'model' => $validated['model'],
            'temperature' => $validated['temperature'],
            'max_tokens' => $validated['maxTokens'],
            'system_prompt' => $validated['systemPrompt'] ?? 'You are a helpful assistant.',
            'advanced_settings' => $validated['advancedSettings'] ?? [],
        ]);

        return response()->json($provider, 201);
    }

    /**
     * Test connection to the AI provider.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function testConnection(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'apiKey' => 'required|string',
        ]);

        try {
            // In a real implementation, this would test the connection to the AI provider
            // For now, we'll simulate a successful connection if the API key is longer than 10 characters
            $success = strlen($validated['apiKey']) > 10;
            
            return response()->json([
                'success' => $success,
                'message' => $success ? 'Connection successful!' : 'Invalid API key or connection failed',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a response from the AI provider.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function generateResponse(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'message' => 'required|string',
            'config' => 'nullable|array',
        ]);

        try {
            $response = $this->aiService->processMessage(
                $validated['provider'],
                $validated['message'],
                $validated['config'] ?? []
            );
            
            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate response: ' . $e->getMessage(),
            ], 500);
        }
    }
}
