<?php

namespace App\Services;

use App\Models\Widget;
use App\Models\Message;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get widget usage analytics.
     *
     * @param int|null $widgetId
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    public function getUsageAnalytics(?int $widgetId = null, Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?? Carbon::now()->subDays(30);
        $endDate = $endDate ?? Carbon::now();

        $query = Message::query()
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($widgetId) {
            $query->where('widget_id', $widgetId);
        }

        // Daily conversation counts
        $dailyStats = $query->clone()
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(DISTINCT session_id) as conversations'),
                DB::raw('COUNT(*) as total_messages'),
                DB::raw('COUNT(CASE WHEN sender_type = "user" THEN 1 END) as user_messages'),
                DB::raw('COUNT(CASE WHEN sender_type = "ai" THEN 1 END) as ai_messages')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'conversations' => (int) $item->conversations,
                    'total_messages' => (int) $item->total_messages,
                    'user_messages' => (int) $item->user_messages,
                    'ai_messages' => (int) $item->ai_messages,
                ];
            });

        // Overall statistics
        $totalConversations = $query->clone()
            ->distinct('session_id')
            ->count();

        $totalMessages = $query->clone()->count();

        $averageMessagesPerConversation = $totalConversations > 0 
            ? round($totalMessages / $totalConversations, 1) 
            : 0;

        // Average response time
        $averageResponseTime = $query->clone()
            ->where('sender_type', 'ai')
            ->whereNotNull('response_time')
            ->avg('response_time');

        return [
            'daily_stats' => $dailyStats,
            'summary' => [
                'total_conversations' => $totalConversations,
                'total_messages' => $totalMessages,
                'average_messages_per_conversation' => $averageMessagesPerConversation,
                'average_response_time' => $averageResponseTime ? round($averageResponseTime, 3) : null,
            ],
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'days' => $startDate->diffInDays($endDate) + 1,
            ]
        ];
    }

    /**
     * Get engagement analytics.
     *
     * @param int|null $widgetId
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    public function getEngagementAnalytics(?int $widgetId = null, Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?? Carbon::now()->subDays(30);
        $endDate = $endDate ?? Carbon::now();

        $query = ChatHistory::query()
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($widgetId) {
            $query->where('widget_id', $widgetId);
        }

        // Session duration analysis
        $sessionDurations = DB::table('messages')
            ->select(
                'session_id',
                DB::raw('MIN(created_at) as session_start'),
                DB::raw('MAX(created_at) as session_end'),
                DB::raw('TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) as duration_seconds'),
                DB::raw('COUNT(*) as message_count')
            )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($widgetId, function ($query, $widgetId) {
                return $query->where('widget_id', $widgetId);
            })
            ->groupBy('session_id')
            ->having('message_count', '>', 1) // Only sessions with multiple messages
            ->get();

        $averageSessionDuration = $sessionDurations->avg('duration_seconds');
        $averageSessionDurationFormatted = $this->formatDuration($averageSessionDuration);

        // Completion rate (sessions with more than 3 messages)
        $totalSessions = $sessionDurations->count();
        $completedSessions = $sessionDurations->where('message_count', '>=', 3)->count();
        $completionRate = $totalSessions > 0 ? round(($completedSessions / $totalSessions) * 100, 1) : 0;

        // Return rate (users who came back)
        $returningSessions = DB::table('chat_histories')
            ->select('user_email')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('user_email')
            ->when($widgetId, function ($query, $widgetId) {
                return $query->where('widget_id', $widgetId);
            })
            ->groupBy('user_email')
            ->havingRaw('COUNT(DISTINCT session_id) > 1')
            ->count();

        $totalUniqueUsers = DB::table('chat_histories')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('user_email')
            ->when($widgetId, function ($query, $widgetId) {
                return $query->where('widget_id', $widgetId);
            })
            ->distinct('user_email')
            ->count();

        $returnRate = $totalUniqueUsers > 0 ? round(($returningSessions / $totalUniqueUsers) * 100, 1) : 0;

        return [
            'average_session_duration' => $averageSessionDurationFormatted,
            'completion_rate' => $completionRate . '%',
            'return_rate' => $returnRate . '%',
            'average_messages_per_session' => $sessionDurations->avg('message_count') ? round($sessionDurations->avg('message_count'), 1) : 0,
            'total_sessions' => $totalSessions,
            'completed_sessions' => $completedSessions,
            'returning_users' => $returningSessions,
            'total_unique_users' => $totalUniqueUsers,
        ];
    }

    /**
     * Get quality analytics (if feedback system is implemented).
     *
     * @param int|null $widgetId
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    public function getQualityAnalytics(?int $widgetId = null, Carbon $startDate = null, Carbon $endDate = null): array
    {
        // Placeholder for quality analytics
        // This would be implemented when feedback/rating system is added
        return [
            'average_rating' => null,
            'rating_distribution' => [
                'excellent' => 0,
                'good' => 0,
                'average' => 0,
                'poor' => 0,
            ],
            'total_ratings' => 0,
            'feedback_count' => 0,
            'note' => 'Quality analytics require a feedback system to be implemented.'
        ];
    }

    /**
     * Get provider performance analytics.
     *
     * @param int|null $widgetId
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    public function getProviderAnalytics(?int $widgetId = null, Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?? Carbon::now()->subDays(30);
        $endDate = $endDate ?? Carbon::now();

        $query = Message::query()
            ->where('sender_type', 'ai')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('ai_provider_id');

        if ($widgetId) {
            $query->where('widget_id', $widgetId);
        }

        $providerStats = $query->clone()
            ->join('ai_providers', 'messages.ai_provider_id', '=', 'ai_providers.id')
            ->select(
                'ai_providers.provider_type',
                'ai_providers.model',
                DB::raw('COUNT(*) as total_responses'),
                DB::raw('AVG(response_time) as avg_response_time'),
                DB::raw('SUM(JSON_EXTRACT(token_usage, "$.total_tokens")) as total_tokens'),
                DB::raw('AVG(JSON_EXTRACT(token_usage, "$.total_tokens")) as avg_tokens_per_response')
            )
            ->groupBy('ai_providers.id', 'ai_providers.provider_type', 'ai_providers.model')
            ->get()
            ->map(function ($item) {
                return [
                    'provider' => $item->provider_type,
                    'model' => $item->model,
                    'total_responses' => (int) $item->total_responses,
                    'avg_response_time' => $item->avg_response_time ? round($item->avg_response_time, 3) : null,
                    'total_tokens' => (int) ($item->total_tokens ?? 0),
                    'avg_tokens_per_response' => $item->avg_tokens_per_response ? round($item->avg_tokens_per_response, 1) : null,
                ];
            });

        return [
            'provider_stats' => $providerStats,
            'total_ai_responses' => $query->count(),
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]
        ];
    }

    /**
     * Get widget overview statistics.
     *
     * @param int $userId
     * @return array
     */
    public function getWidgetOverview(int $userId): array
    {
        $widgets = Widget::where('user_id', $userId)->get();
        
        $totalWidgets = $widgets->count();
        $activeWidgets = $widgets->where('status', 'active')->count();
        $draftWidgets = $widgets->where('status', 'draft')->count();

        // Get total conversations across all widgets
        $totalConversations = Message::whereIn('widget_id', $widgets->pluck('id'))
            ->distinct('session_id')
            ->count();

        // Get average rating (placeholder)
        $averageRating = 4.8; // This would come from actual feedback data

        // Get response rate (percentage of sessions that got AI responses)
        $sessionsWithResponses = Message::whereIn('widget_id', $widgets->pluck('id'))
            ->where('sender_type', 'ai')
            ->distinct('session_id')
            ->count();

        $responseRate = $totalConversations > 0 
            ? round(($sessionsWithResponses / $totalConversations) * 100, 1) 
            : 0;

        return [
            'total_widgets' => $totalWidgets,
            'active_widgets' => $activeWidgets,
            'draft_widgets' => $draftWidgets,
            'total_conversations' => $totalConversations,
            'average_rating' => $averageRating,
            'response_rate' => $responseRate . '%',
        ];
    }

    /**
     * Format duration in seconds to human readable format.
     *
     * @param float|null $seconds
     * @return string
     */
    private function formatDuration(?float $seconds): string
    {
        if (!$seconds) {
            return '0s';
        }

        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        if ($minutes > 0) {
            return $minutes . 'm ' . round($remainingSeconds) . 's';
        }

        return round($remainingSeconds) . 's';
    }
}
