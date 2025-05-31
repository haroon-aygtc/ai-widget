<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ChatHistory;
use App\Models\Widget;
use App\Models\AIProvider;
use App\Services\AI\AIServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    // Removed dependency injection - using factory pattern instead

    /**
     * Get chat history by session ID.
     *
     * @param string $sessionId
     * @return JsonResponse
     */
    public function getBySession(string $sessionId): JsonResponse
    {
        try {
            $messages = Message::where('session_id', $sessionId)
                             ->orderBy('created_at', 'asc')
                             ->get();

            return response()->json($messages);
        } catch (\Exception $e) {
            Log::error('Chat history retrieval error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve chat history'], 500);
        }
    }

    /**
     * Send message to AI provider
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string',
                'provider_id' => 'required|exists:ai_providers,id',
                'conversation_history' => 'nullable|array',
                'conversation_history.*.role' => 'required_with:conversation_history|in:user,assistant',
                'conversation_history.*.content' => 'required_with:conversation_history|string'
            ]);

            $provider = AIProvider::findOrFail($validated['provider_id']);

            if (!$provider->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected AI provider is not active'
                ], 400);
            }

            if (!$provider->api_key) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI provider is not configured with API key'
                ], 400);
            }

            $service = AIServiceFactory::create($provider);

            $context = [
                'conversation_history' => $validated['conversation_history'] ?? []
            ];

            $startTime = microtime(true);
            $response = $service->generateResponse($validated['message'], $context);
            $responseTime = microtime(true) - $startTime;

            // Add response time if not already included
            if (!isset($response['response_time'])) {
                $response['response_time'] = $responseTime;
            }

            return response()->json([
                'success' => $response['success'],
                'data' => $response
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Chat request failed', [
                'error' => $e->getMessage(),
                'provider_id' => $request->input('provider_id'),
                'message_length' => strlen($request->input('message', ''))
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chat request failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stream message to AI provider
     */
    public function streamMessage(Request $request)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string',
                'provider_id' => 'required|exists:ai_providers,id',
                'conversation_history' => 'nullable|array',
                'conversation_history.*.role' => 'required_with:conversation_history|in:user,assistant',
                'conversation_history.*.content' => 'required_with:conversation_history|string'
            ]);

            $provider = AIProvider::findOrFail($validated['provider_id']);

            if (!$provider->is_active || !$provider->api_key) {
                return response()->json(['error' => 'Provider not available'], 400);
            }

            $service = AIServiceFactory::create($provider);

            $context = [
                'conversation_history' => $validated['conversation_history'] ?? []
            ];

            return $service->streamResponse($validated['message'], $context);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Stream request failed', [
                'error' => $e->getMessage(),
                'provider_id' => $request->input('provider_id')
            ]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get available providers for chat
     */
    public function getAvailableProviders(): JsonResponse
    {
        try {
            $providers = AIProvider::where('is_active', true)
                ->whereNotNull('api_key')
                ->select(['id', 'name', 'provider_type', 'model'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $providers
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch available providers', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available providers'
            ], 500);
        }
    }

    /**
     * Test a quick message with a provider
     */
    public function testProvider(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'provider_id' => 'required|exists:ai_providers,id',
                'test_message' => 'nullable|string'
            ]);

            $provider = AIProvider::findOrFail($validated['provider_id']);

            if (!$provider->is_active || !$provider->api_key) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider not available for testing'
                ], 400);
            }

            $service = AIServiceFactory::create($provider);
            $testMessage = $validated['test_message'] ?? 'Hello! Please respond with a brief greeting to confirm you are working correctly.';

            $response = $service->generateResponse($testMessage, []);

            return response()->json([
                'success' => $response['success'],
                'data' => [
                    'provider_name' => $provider->name,
                    'provider_type' => $provider->provider_type,
                    'model' => $provider->model,
                    'test_message' => $testMessage,
                    'response' => $response
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Provider test failed', [
                'error' => $e->getMessage(),
                'provider_id' => $request->input('provider_id')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Provider test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get provider statistics
     */
    public function getProviderStats(): JsonResponse
    {
        try {
            $stats = AIProvider::selectRaw('
                provider_type,
                COUNT(*) as total_configured,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN api_key IS NOT NULL THEN 1 ELSE 0 END) as configured_count
            ')
            ->groupBy('provider_type')
            ->get();

            $totalProviders = AIProvider::count();
            $activeProviders = AIProvider::where('is_active', true)->whereNotNull('api_key')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_providers' => $totalProviders,
                    'active_providers' => $activeProviders,
                    'provider_breakdown' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch provider stats', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch provider statistics'
            ], 500);
        }
    }

    /**
     * Get all chats for authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ChatHistory::whereHas('widget', function ($q) {
                $q->where('user_id', Auth::id());
            })->with(['widget:id,name']);

            // Apply filters
            if ($request->has('widget_id')) {
                $query->where('widget_id', $request->widget_id);
            }

            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $chats = $query->paginate($perPage);

            return response()->json([
                'data' => $chats->items(),
                'current_page' => $chats->currentPage(),
                'last_page' => $chats->lastPage(),
                'per_page' => $chats->perPage(),
                'total' => $chats->total()
            ]);
        } catch (\Exception $e) {
            Log::error('Chat index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch chats'], 500);
        }
    }

    /**
     * Get detailed chat conversation.
     *
     * @param string $sessionId
     * @return JsonResponse
     */
    public function show(string $sessionId): JsonResponse
    {
        try {
            // Verify user has access to this chat
            $chatHistory = ChatHistory::where('session_id', $sessionId)
                                    ->whereHas('widget', function ($q) {
                                        $q->where('user_id', Auth::id());
                                    })
                                    ->with(['widget:id,name'])
                                    ->firstOrFail();

            $messages = Message::where('session_id', $sessionId)
                             ->orderBy('created_at', 'asc')
                             ->get();

            return response()->json([
                'chat_info' => $chatHistory,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            Log::error('Chat show error: ' . $e->getMessage());
            return response()->json(['error' => 'Chat not found'], 404);
        }
    }

    /**
     * Delete a chat session.
     *
     * @param string $sessionId
     * @return JsonResponse
     */
    public function destroy(string $sessionId): JsonResponse
    {
        try {
            // Verify user has access to this chat
            $chatHistory = ChatHistory::where('session_id', $sessionId)
                                    ->whereHas('widget', function ($q) {
                                        $q->where('user_id', Auth::id());
                                    })
                                    ->firstOrFail();

            // Delete messages
            Message::where('session_id', $sessionId)->delete();

            // Delete chat history
            $chatHistory->delete();

            Log::info('Chat deleted', ['session_id' => $sessionId, 'user_id' => Auth::id()]);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Chat deletion error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete chat'], 500);
        }
    }

    /**
     * Get conversation context for AI processing.
     *
     * @param string $sessionId
     * @param int $maxMessages
     * @return array
     */
    protected function getConversationContext(string $sessionId, int $maxMessages = 10): array
    {
        $messages = Message::where('session_id', $sessionId)
                         ->orderBy('created_at', 'desc')
                         ->limit($maxMessages)
                         ->get()
                         ->reverse()
                         ->values();

        return $messages->map(function ($message) {
            return [
                'role' => $message->sender_type === 'user' ? 'user' : 'assistant',
                'content' => $message->message
            ];
        })->toArray();
    }

    /**
     * Build system prompt with widget configuration and user data.
     *
     * @param Widget $widget
     * @param array|null $userData
     * @return string
     */
    protected function buildSystemPrompt(Widget $widget, ?array $userData = null): string
    {
        $basePrompt = $widget->aiProvider->system_prompt ?? 'You are a helpful assistant.';

        // Add widget-specific context
        $widgetContext = "\n\nWidget Context:\n";
        $widgetContext .= "- Widget Name: {$widget->name}\n";
        $widgetContext .= "- Welcome Message: {$widget->behavior['welcomeMessage']}\n";

        if ($userData) {
            $widgetContext .= "\nUser Information:\n";
            if (isset($userData['name'])) {
                $widgetContext .= "- Name: {$userData['name']}\n";
            }
            if (isset($userData['email'])) {
                $widgetContext .= "- Email: {$userData['email']}\n";
            }
        }

        return $basePrompt . $widgetContext;
    }

    /**
     * Update or create chat history record.
     *
     * @param int $widgetId
     * @param string $sessionId
     * @param array|null $userData
     * @return void
     */
    protected function updateChatHistory(int $widgetId, string $sessionId, ?array $userData = null): void
    {
        ChatHistory::updateOrCreate(
            [
                'widget_id' => $widgetId,
                'session_id' => $sessionId
            ],
            [
                'user_name' => $userData['name'] ?? null,
                'user_email' => $userData['email'] ?? null,
                'user_phone' => $userData['phone'] ?? null,
                'last_message_at' => now()
            ]
        );
    }

    /**
     * Sanitize user input.
     *
     * @param string $input
     * @return string
     */
    protected function sanitizeInput(string $input): string
    {
        // Remove HTML tags and decode entities
        $sanitized = strip_tags($input);
        $sanitized = html_entity_decode($sanitized, ENT_QUOTES, 'UTF-8');

        // Trim whitespace
        $sanitized = trim($sanitized);

        // Remove excessive whitespace
        $sanitized = preg_replace('/\s+/', ' ', $sanitized);

        return $sanitized;
    }
}
