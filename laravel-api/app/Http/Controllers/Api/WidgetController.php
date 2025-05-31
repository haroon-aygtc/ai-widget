<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Widget;
use App\Models\AIProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class WidgetController extends Controller
{
    /**
     * Display a listing of widgets for the authenticated user.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Widget::where('user_id', Auth::id())
                          ->with(['aiProvider:id,provider_type,model']);
            
            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }
            
            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $widgets = $query->paginate($perPage);
            
            return response()->json([
                'data' => $widgets->items(),
                'current_page' => $widgets->currentPage(),
                'last_page' => $widgets->lastPage(),
                'per_page' => $widgets->perPage(),
                'total' => $widgets->total()
            ]);
        } catch (\Exception $e) {
            Log::error('Widget index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch widgets'], 500);
        }
    }

    /**
     * Store a newly created widget.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'ai_provider_id' => 'nullable|exists:a_i_providers,id',
            'design' => 'required|array',
            'design.primaryColor' => 'required|string',
            'design.secondaryColor' => 'required|string',
            'design.textColor' => 'required|string',
            'design.fontFamily' => 'required|string',
            'design.fontSize' => 'required|integer|min:10|max:24',
            'design.borderRadius' => 'required|integer|min:0|max:50',
            'design.headerText' => 'required|string|max:100',
            'design.buttonText' => 'required|string|max:50',
            'design.placeholderText' => 'required|string|max:200',
            'behavior' => 'required|array',
            'behavior.welcomeMessage' => 'required|string|max:500',
            'behavior.initialMessage' => 'nullable|string|max:500',
            'behavior.typingIndicator' => 'required|boolean',
            'behavior.showTimestamp' => 'required|boolean',
            'behavior.autoResponse' => 'required|boolean',
            'behavior.responseDelay' => 'required|integer|min:0|max:5000',
            'behavior.maxMessages' => 'required|integer|min:10|max:500',
            'placement' => 'required|array',
            'placement.position' => 'required|string|in:bottom-right,bottom-left,top-right,top-left',
            'placement.offsetX' => 'required|integer|min:0|max:100',
            'placement.offsetY' => 'required|integer|min:0|max:100',
            'placement.mobilePosition' => 'required|string',
            'placement.showOnPages' => 'required|string',
            'placement.excludePages' => 'nullable|string',
            'placement.triggerType' => 'required|string|in:button,tab,auto',
            'placement.triggerText' => 'nullable|string|max:50',
            'status' => 'required|string|in:active,draft,archived'
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
            
            $widget = Widget::create([
                'user_id' => Auth::id(),
                'a_i_provider_id' => $request->ai_provider_id,
                'name' => $request->name,
                'description' => $request->description,
                'design' => $request->design,
                'behavior' => $request->behavior,
                'placement' => $request->placement,
                'status' => $request->status,
            ]);
            
            $widget->load('aiProvider:id,provider_type,model');
            
            Log::info('Widget created', ['widget_id' => $widget->id, 'user_id' => Auth::id()]);
            
            return response()->json($widget, 201);
        } catch (\Exception $e) {
            Log::error('Widget creation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create widget'], 500);
        }
    }

    /**
     * Display the specified widget.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $widget = Widget::where('user_id', Auth::id())
                          ->with(['aiProvider:id,provider_type,model'])
                          ->findOrFail($id);
            
            return response()->json($widget);
        } catch (\Exception $e) {
            Log::error('Widget show error: ' . $e->getMessage());
            return response()->json(['error' => 'Widget not found'], 404);
        }
    }

    /**
     * Update the specified widget.
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'ai_provider_id' => 'nullable|exists:a_i_providers,id',
            'design' => 'sometimes|array',
            'behavior' => 'sometimes|array',
            'placement' => 'sometimes|array',
            'status' => 'sometimes|string|in:active,draft,archived'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $widget = Widget::where('user_id', Auth::id())->findOrFail($id);
            
            // Verify AI provider belongs to user if provided
            if ($request->has('ai_provider_id') && $request->ai_provider_id) {
                $aiProvider = AIProvider::where('id', $request->ai_provider_id)
                                      ->where('user_id', Auth::id())
                                      ->first();
                if (!$aiProvider) {
                    return response()->json(['error' => 'AI Provider not found'], 404);
                }
            }
            
            $widget->update($request->only([
                'name', 'description', 'ai_provider_id', 'design', 
                'behavior', 'placement', 'status'
            ]));
            
            $widget->load('aiProvider:id,provider_type,model');
            
            Log::info('Widget updated', ['widget_id' => $widget->id, 'user_id' => Auth::id()]);
            
            return response()->json($widget);
        } catch (\Exception $e) {
            Log::error('Widget update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update widget'], 500);
        }
    }

    /**
     * Remove the specified widget.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $widget = Widget::where('user_id', Auth::id())->findOrFail($id);
            $widget->delete();
            
            Log::info('Widget deleted', ['widget_id' => $id, 'user_id' => Auth::id()]);
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Widget deletion error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete widget'], 500);
        }
    }
    
    /**
     * Generate embed code for the specified widget.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function generateEmbedCode(string $id): JsonResponse
    {
        try {
            $widget = Widget::where('user_id', Auth::id())->findOrFail($id);
            
            if (empty($widget->embed_code)) {
                $widget->embed_code = Str::uuid()->toString();
                $widget->save();
            }
            
            $baseUrl = config('app.url');
            $embedCode = "<script src=\"{$baseUrl}/widget.js\" data-widget-id=\"{$widget->embed_code}\"></script>";
            
            return response()->json([
                'embed_code' => $embedCode,
                'widget_id' => $widget->embed_code,
                'instructions' => [
                    'Copy the embed code above',
                    'Paste it into your website\'s HTML',
                    'The widget will appear automatically',
                    'Customize position and behavior in the widget settings'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Embed code generation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate embed code'], 500);
        }
    }
    
    /**
     * Get widget configuration by embed code (public endpoint).
     * 
     * @param string $embedCode
     * @return JsonResponse
     */
    public function getConfig(string $embedCode): JsonResponse
    {
        try {
            $cacheKey = "widget_config_{$embedCode}";
            
            $config = Cache::remember($cacheKey, 300, function () use ($embedCode) {
                $widget = Widget::where('embed_code', $embedCode)
                               ->where('status', 'active')
                               ->with(['aiProvider:id,provider_type,model'])
                               ->first();
                
                if (!$widget) {
                    return null;
                }
                
                return [
                    'id' => $widget->id,
                    'name' => $widget->name,
                    'design' => $widget->design,
                    'behavior' => $widget->behavior,
                    'placement' => $widget->placement,
                    'ai_provider' => $widget->aiProvider ? [
                        'type' => $widget->aiProvider->provider_type,
                        'model' => $widget->aiProvider->model
                    ] : null
                ];
            });
            
            if (!$config) {
                return response()->json(['error' => 'Widget not found or inactive'], 404);
            }
            
            return response()->json($config);
        } catch (\Exception $e) {
            Log::error('Widget config retrieval error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get widget configuration'], 500);
        }
    }
    
    /**
     * Get widget analytics.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function getAnalytics(string $id): JsonResponse
    {
        try {
            $widget = Widget::where('user_id', Auth::id())->findOrFail($id);
            
            // Get chat statistics
            $totalChats = $widget->chatHistories()->count();
            $todayChats = $widget->chatHistories()
                                ->whereDate('created_at', today())
                                ->count();
            $weekChats = $widget->chatHistories()
                               ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                               ->count();
            $monthChats = $widget->chatHistories()
                                ->whereMonth('created_at', now()->month)
                                ->count();
            
            // Get daily chat counts for the last 30 days
            $dailyChats = $widget->chatHistories()
                                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                                ->where('created_at', '>=', now()->subDays(30))
                                ->groupBy('date')
                                ->orderBy('date')
                                ->get();
            
            return response()->json([
                'total_chats' => $totalChats,
                'today_chats' => $todayChats,
                'week_chats' => $weekChats,
                'month_chats' => $monthChats,
                'daily_chats' => $dailyChats,
                'widget_status' => $widget->status,
                'created_at' => $widget->created_at
            ]);
        } catch (\Exception $e) {
            Log::error('Widget analytics error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get widget analytics'], 500);
        }
    }
    
    /**
     * Duplicate a widget.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function duplicate(string $id): JsonResponse
    {
        try {
            $originalWidget = Widget::where('user_id', Auth::id())->findOrFail($id);
            
            $newWidget = $originalWidget->replicate();
            $newWidget->name = $originalWidget->name . ' (Copy)';
            $newWidget->status = 'draft';
            $newWidget->embed_code = Str::uuid()->toString();
            $newWidget->save();
            
            $newWidget->load('aiProvider:id,provider_type,model');
            
            Log::info('Widget duplicated', [
                'original_id' => $id, 
                'new_id' => $newWidget->id, 
                'user_id' => Auth::id()
            ]);
            
            return response()->json($newWidget, 201);
        } catch (\Exception $e) {
            Log::error('Widget duplication error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to duplicate widget'], 500);
        }
    }
}
