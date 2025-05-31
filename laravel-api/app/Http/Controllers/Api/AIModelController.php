<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIModel;
use App\Models\AIProvider;
use App\Services\AI\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class AIModelController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Display a listing of AI models.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AIModel::where('user_id', Auth::id())
                           ->with(['aiProvider:id,provider_type,model']);

            // Apply filters
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            if ($request->has('provider_type')) {
                $query->where('provider_type', $request->provider_type);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('is_featured')) {
                $query->where('is_featured', $request->boolean('is_featured'));
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $models = $query->paginate($perPage);

            return response()->json([
                'data' => $models->items(),
                'current_page' => $models->currentPage(),
                'last_page' => $models->lastPage(),
                'per_page' => $models->perPage(),
                'total' => $models->total()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Model index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch AI models'], 500);
        }
    }

    /**
     * Store a newly created AI model.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'model_id' => 'required|string|max:255',
            'provider_type' => 'required|string|max:100',
            'ai_provider_id' => 'nullable|exists:a_i_providers,id',
            'description' => 'nullable|string|max:1000',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'capabilities' => 'nullable|array',
            'configuration' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Verify AI provider belongs to user if provided
            if ($request->ai_provider_id) {
                $aiProvider = AIProvider::where('id', $request->ai_provider_id)
                                      ->where('user_id', Auth::id())
                                      ->first();
                if (!$aiProvider) {
                    return response()->json(['error' => 'AI Provider not found'], 404);
                }
            }

            $model = AIModel::create([
                'user_id' => Auth::id(),
                'ai_provider_id' => $request->ai_provider_id,
                'name' => $request->name,
                'model_id' => $request->model_id,
                'provider_type' => $request->provider_type,
                'description' => $request->description,
                'temperature' => $request->temperature ?? 0.7,
                'max_tokens' => $request->max_tokens ?? 1000,
                'system_prompt' => $request->system_prompt,
                'capabilities' => $request->capabilities,
                'configuration' => $request->configuration,
                'is_active' => $request->is_active ?? true,
                'is_featured' => $request->is_featured ?? false,
            ]);

            $model->load('aiProvider:id,provider_type,model');

            Log::info('AI Model created', ['model_id' => $model->id, 'user_id' => Auth::id()]);

            return response()->json($model, 201);
        } catch (\Exception $e) {
            Log::error('AI Model creation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create AI model'], 500);
        }
    }

    /**
     * Display the specified AI model.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $model = AIModel::where('user_id', Auth::id())
                          ->with(['aiProvider:id,provider_type,model'])
                          ->findOrFail($id);

            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('AI Model show error: ' . $e->getMessage());
            return response()->json(['error' => 'AI Model not found'], 404);
        }
    }

    /**
     * Update the specified AI model.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'model_id' => 'sometimes|string|max:255',
            'provider_type' => 'sometimes|string|max:100',
            'ai_provider_id' => 'nullable|exists:a_i_providers,id',
            'description' => 'nullable|string|max:1000',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
            'capabilities' => 'nullable|array',
            'configuration' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $model = AIModel::where('user_id', Auth::id())->findOrFail($id);

            // Verify AI provider belongs to user if provided
            if ($request->has('ai_provider_id') && $request->ai_provider_id) {
                $aiProvider = AIProvider::where('id', $request->ai_provider_id)
                                      ->where('user_id', Auth::id())
                                      ->first();
                if (!$aiProvider) {
                    return response()->json(['error' => 'AI Provider not found'], 404);
                }
            }

            $model->update($request->only([
                'name', 'model_id', 'provider_type', 'ai_provider_id', 'description',
                'temperature', 'max_tokens', 'system_prompt', 'capabilities',
                'configuration', 'is_active', 'is_featured'
            ]));

            $model->load('aiProvider:id,provider_type,model');

            Log::info('AI Model updated', ['model_id' => $model->id, 'user_id' => Auth::id()]);

            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('AI Model update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update AI model'], 500);
        }
    }

    /**
     * Remove the specified AI model.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $model = AIModel::where('user_id', Auth::id())->findOrFail($id);
            $model->delete();

            Log::info('AI Model deleted', ['model_id' => $id, 'user_id' => Auth::id()]);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('AI Model deletion error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete AI model'], 500);
        }
    }

    /**
     * Fetch available models from AI provider.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function fetchAvailableModels(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string',
            'api_key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $providerService = $this->aiService->getProvider($request->provider);
            
            if (method_exists($providerService, 'getAvailableModels')) {
                $models = $providerService->getAvailableModels();
                return response()->json([
                    'success' => true,
                    'models' => array_map(function($key, $name) {
                        return ['id' => $key, 'name' => $name];
                    }, array_keys($models), array_values($models))
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Provider does not support model listing'
            ]);
        } catch (\Exception $e) {
            Log::error('Fetch available models error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an AI model.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function testModel(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string',
            'model_id' => 'required|string',
            'api_key' => 'required|string',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $startTime = microtime(true);
            
            $config = [
                'apiKey' => $request->api_key,
                'model' => $request->model_id,
                'temperature' => $request->temperature ?? 0.7,
                'maxTokens' => $request->max_tokens ?? 100,
                'systemPrompt' => $request->system_prompt ?? 'You are a helpful assistant.',
            ];

            $result = $this->aiService->processMessage(
                $request->provider,
                'Hello! This is a test message to verify the model is working correctly.',
                $config
            );

            $responseTime = microtime(true) - $startTime;

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'response' => $result['response'],
                    'metrics' => [
                        'responseTime' => round($responseTime * 1000, 2),
                        'tokenUsage' => $result['token_usage'] ?? null,
                        'model' => $result['model'] ?? $request->model_id,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Test failed'
            ]);
        } catch (\Exception $e) {
            Log::error('AI Model test error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle active status of an AI model.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function toggleActive(string $id): JsonResponse
    {
        try {
            $model = AIModel::where('user_id', Auth::id())->findOrFail($id);
            $model->is_active = !$model->is_active;
            $model->save();

            Log::info('AI Model active status toggled', [
                'model_id' => $model->id,
                'is_active' => $model->is_active,
                'user_id' => Auth::id()
            ]);

            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('AI Model toggle active error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to toggle model status'], 500);
        }
    }

    /**
     * Toggle featured status of an AI model.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function toggleFeatured(string $id): JsonResponse
    {
        try {
            $model = AIModel::where('user_id', Auth::id())->findOrFail($id);
            $model->is_featured = !$model->is_featured;
            $model->save();

            Log::info('AI Model featured status toggled', [
                'model_id' => $model->id,
                'is_featured' => $model->is_featured,
                'user_id' => Auth::id()
            ]);

            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('AI Model toggle featured error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to toggle featured status'], 500);
        }
    }
}
