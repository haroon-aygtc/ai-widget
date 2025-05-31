<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAIModelRequest;
use App\Http\Requests\UpdateAIModelRequest;
use App\Models\AIModel;
use App\Models\AIProvider;
use App\Services\AI\AIModelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AIModelController extends Controller
{
    protected $modelService;

    public function __construct(AIModelService $modelService)
    {
        $this->modelService = $modelService;
    }

    /**
     * Display a listing of AI models.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = AIModel::where('user_id', Auth::id());

        // Apply filters if provided
        if ($request->has('provider_type')) {
            $query->where('provider_type', $request->provider_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('model_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort options
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'provider_type', 'created_at', 'is_active', 'is_featured'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        // Pagination
        $perPage = $request->get('per_page', 10);
        $models = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $models->items(),
            'total' => $models->total(),
            'per_page' => $models->perPage(),
            'current_page' => $models->currentPage(),
            'last_page' => $models->lastPage()
        ]);
    }

    /**
     * Store a newly created AI model.
     *
     * @param StoreAIModelRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreAIModelRequest $request)
    {
        try {
            $data = $request->validated();
            $data['user_id'] = Auth::id();

            // Initialize performance metrics
            $data['performance_metrics'] = [
                'usage_count' => 0,
                'total_response_time' => 0,
                'avg_response_time' => 0,
                'total_tokens' => 0,
                'last_used' => null
            ];

            $model = AIModel::create($data);

            return response()->json([
                'success' => true,
                'data' => $model,
                'message' => 'AI model created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create AI model', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create AI model',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified AI model.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $model = AIModel::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'AI model not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $model
        ]);
    }

    /**
     * Update the specified AI model.
     *
     * @param UpdateAIModelRequest $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateAIModelRequest $request, $id)
    {
        try {
            $model = AIModel::where('id', $id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$model) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI model not found'
                ], 404);
            }

            $model->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $model->fresh(),
                'message' => 'AI model updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update AI model', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update AI model',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified AI model.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $model = AIModel::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'AI model not found'
            ], 404);
        }

        $model->delete();

        return response()->json([
            'success' => true,
            'message' => 'AI model deleted successfully'
        ]);
    }

    /**
     * Fetch available models from a provider.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fetchAvailableModels(Request $request)
    {
        $request->validate([
            'provider' => 'required|string',
            'api_key' => 'required|string'
        ]);

        try {
            $result = $this->modelService->fetchAvailableModels(
                $request->provider,
                $request->api_key
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to fetch available models', [
                'provider' => $request->provider,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'models' => []
            ], 500);
        }
    }

    /**
     * Test a specific model with a sample prompt.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testModel(Request $request)
    {
        $request->validate([
            'provider' => 'required|string',
            'model_id' => 'required|string',
            'api_key' => 'required|string',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:32000',
            'system_prompt' => 'nullable|string'
        ]);

        try {
            $config = [
                'apiKey' => $request->api_key,
                'temperature' => $request->temperature ?? 0.7,
                'maxTokens' => $request->max_tokens ?? 1000,
                'systemPrompt' => $request->system_prompt
            ];

            $result = $this->modelService->testModel(
                $request->provider,
                $request->model_id,
                $config
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to test model', [
                'provider' => $request->provider,
                'model' => $request->model_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle the active status of an AI model.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleActive($id)
    {
        $model = AIModel::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'AI model not found'
            ], 404);
        }

        $model->is_active = !$model->is_active;
        $model->save();

        return response()->json([
            'success' => true,
            'data' => $model,
            'message' => 'AI model status updated successfully'
        ]);
    }

    /**
     * Toggle the featured status of an AI model.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleFeatured($id)
    {
        $model = AIModel::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'AI model not found'
            ], 404);
        }

        $model->is_featured = !$model->is_featured;
        $model->save();

        return response()->json([
            'success' => true,
            'data' => $model,
            'message' => 'AI model featured status updated successfully'
        ]);
    }
}