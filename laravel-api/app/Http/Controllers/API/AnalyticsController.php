<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get dashboard overview analytics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function overview(Request $request): JsonResponse
    {
        try {
            $overview = $this->analyticsService->getWidgetOverview(Auth::id());
            
            return response()->json([
                'success' => true,
                'data' => $overview
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch overview analytics'
            ], 500);
        }
    }

    /**
     * Get usage analytics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function usage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'sometimes|integer|exists:widgets,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'period' => 'sometimes|in:7d,30d,90d,1y'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            [$startDate, $endDate] = $this->parseDateRange($request);
            
            $analytics = $this->analyticsService->getUsageAnalytics(
                $request->widget_id,
                $startDate,
                $endDate
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch usage analytics'
            ], 500);
        }
    }

    /**
     * Get engagement analytics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function engagement(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'sometimes|integer|exists:widgets,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'period' => 'sometimes|in:7d,30d,90d,1y'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            [$startDate, $endDate] = $this->parseDateRange($request);
            
            $analytics = $this->analyticsService->getEngagementAnalytics(
                $request->widget_id,
                $startDate,
                $endDate
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch engagement analytics'
            ], 500);
        }
    }

    /**
     * Get quality analytics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function quality(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'sometimes|integer|exists:widgets,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'period' => 'sometimes|in:7d,30d,90d,1y'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            [$startDate, $endDate] = $this->parseDateRange($request);
            
            $analytics = $this->analyticsService->getQualityAnalytics(
                $request->widget_id,
                $startDate,
                $endDate
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch quality analytics'
            ], 500);
        }
    }

    /**
     * Get provider performance analytics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function providers(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'sometimes|integer|exists:widgets,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'period' => 'sometimes|in:7d,30d,90d,1y'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            [$startDate, $endDate] = $this->parseDateRange($request);
            
            $analytics = $this->analyticsService->getProviderAnalytics(
                $request->widget_id,
                $startDate,
                $endDate
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch provider analytics'
            ], 500);
        }
    }

    /**
     * Get comprehensive analytics report.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function report(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'widget_id' => 'sometimes|integer|exists:widgets,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'period' => 'sometimes|in:7d,30d,90d,1y',
            'include' => 'sometimes|array',
            'include.*' => 'in:usage,engagement,quality,providers'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            [$startDate, $endDate] = $this->parseDateRange($request);
            $include = $request->get('include', ['usage', 'engagement', 'quality', 'providers']);
            
            $report = [];

            if (in_array('usage', $include)) {
                $report['usage'] = $this->analyticsService->getUsageAnalytics(
                    $request->widget_id,
                    $startDate,
                    $endDate
                );
            }

            if (in_array('engagement', $include)) {
                $report['engagement'] = $this->analyticsService->getEngagementAnalytics(
                    $request->widget_id,
                    $startDate,
                    $endDate
                );
            }

            if (in_array('quality', $include)) {
                $report['quality'] = $this->analyticsService->getQualityAnalytics(
                    $request->widget_id,
                    $startDate,
                    $endDate
                );
            }

            if (in_array('providers', $include)) {
                $report['providers'] = $this->analyticsService->getProviderAnalytics(
                    $request->widget_id,
                    $startDate,
                    $endDate
                );
            }

            return response()->json([
                'success' => true,
                'data' => $report,
                'generated_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate analytics report'
            ], 500);
        }
    }

    /**
     * Parse date range from request.
     *
     * @param Request $request
     * @return array
     */
    private function parseDateRange(Request $request): array
    {
        if ($request->has('start_date') && $request->has('end_date')) {
            return [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay()
            ];
        }

        $period = $request->get('period', '30d');
        $endDate = Carbon::now()->endOfDay();

        $startDate = match ($period) {
            '7d' => Carbon::now()->subDays(7)->startOfDay(),
            '30d' => Carbon::now()->subDays(30)->startOfDay(),
            '90d' => Carbon::now()->subDays(90)->startOfDay(),
            '1y' => Carbon::now()->subYear()->startOfDay(),
            default => Carbon::now()->subDays(30)->startOfDay()
        };

        return [$startDate, $endDate];
    }
}
