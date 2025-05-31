<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ChatHistory;
use App\Models\Widget;
use App\Services\AI\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

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
     * Send a message and get AI response.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'required|string',
            'session_id' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'user_data' => 'nullable|array',
            'user_data.name' => 'nullable|string|max:100',
            'user_data.email' => 'nullable|email|max:255',
            'user_data.phone' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Rate limiting
        $rateLimitKey = 'chat_message:' . $request->ip() . ':' . $request->session_id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 30)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'error' => 'Too many messages. Please wait ' . $seconds . ' seconds.'
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60); // 30 messages per minute

        try {
            // Get widget configuration
            $widget = Widget::where('embed_code', $request->widget_id)
                          ->where('status', 'active')
                          ->with('aiProvider')
                          ->first();

            if (!$widget) {
                return response()->json(['error' => 'Widget not found or inactive'], 404);
            }

            if (!$widget->aiProvider) {
                return response()->json(['error' => 'No AI provider configured for this widget'], 400);
            }

            // Sanitize input
            $sanitizedMessage = $this->sanitizeInput($request->message);

            // Store user message
            $userMessage = Message::create([
                'session_id' => $request->session_id,
                'widget_id' => $widget->id,
                'sender_type' => 'user',
                'message' => $sanitizedMessage,
                'user_data' => $request->user_data,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Get conversation context
            $context = $this->getConversationContext($request->session_id, $widget->behavior['maxMessages'] ?? 10);

            // Prepare AI configuration with decrypted API key
            $aiConfig = [
                'apiKey' => $widget->aiProvider->decrypted_api_key,
                'model' => $widget->aiProvider->model,
                'temperature' => $widget->aiProvider->temperature ?? 0.7,
                'maxTokens' => $widget->aiProvider->max_tokens ?? 2048,
                'systemPrompt' => $this->buildSystemPrompt($widget, $request->user_data)
            ];

            // Generate AI response
            $aiResponse = $this->aiService->processMessage(
                $widget->aiProvider->provider_type,
                $sanitizedMessage,
                $aiConfig,
                false,
                $context
            );

            if (!$aiResponse['success']) {
                throw new \Exception($aiResponse['message'] ?? 'AI service error');
            }

            // Store AI response
            $aiMessage = Message::create([
                'session_id' => $request->session_id,
                'widget_id' => $widget->id,
                'sender_type' => 'ai',
                'message' => $aiResponse['response'],
                'response_time' => $aiResponse['response_time'] ?? null,
                'token_usage' => $aiResponse['token_usage'] ?? null,
                'model_used' => $aiResponse['model'] ?? $widget->aiProvider->model
            ]);

            // Update or create chat history record
            $this->updateChatHistory($widget->id, $request->session_id, $request->user_data);

            Log::info('Chat message processed', [
                'widget_id' => $widget->id,
                'session_id' => $request->session_id,
                'response_time' => $aiResponse['response_time'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'response' => $aiResponse['response'],
                'message_id' => $aiMessage->id,
                'response_time' => $aiResponse['response_time'] ?? null
            ]);

        } catch (\Exception $e) {
            Log::error('Chat message error: ' . $e->getMessage(), [
                'widget_id' => $request->widget_id,
                'session_id' => $request->session_id
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Sorry, I encountered an error processing your message. Please try again.'
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
