<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    /**
     * Get settings by type.
     *
     * @param string $type
     * @return JsonResponse
     */
    public function get(string $type): JsonResponse
    {
        try {
            $setting = Setting::where('user_id', Auth::id())
                             ->where('type', $type)
                             ->first();

            if (!$setting) {
                // Return default settings if none exist
                return response()->json([
                    'type' => $type,
                    'settings' => $this->getDefaultSettings($type)
                ]);
            }

            return response()->json($setting);
        } catch (\Exception $e) {
            Log::error('Settings get error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch settings'], 500);
        }
    }

    /**
     * Update or create settings.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:general,notifications,security,api,email,appearance',
            'settings' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $setting = Setting::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'type' => $request->type
                ],
                [
                    'settings' => $request->settings
                ]
            );

            Log::info('Settings updated', [
                'user_id' => Auth::id(),
                'type' => $request->type
            ]);

            return response()->json($setting);
        } catch (\Exception $e) {
            Log::error('Settings update error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update settings'], 500);
        }
    }

    /**
     * Get default settings by type.
     *
     * @param string $type
     * @return array
     */
    private function getDefaultSettings(string $type): array
    {
        switch ($type) {
            case 'general':
                return [
                    'siteName' => 'AI Chat Widget Platform',
                    'siteDescription' => 'Build and deploy AI-powered chat widgets',
                    'contactEmail' => 'support@example.com',
                    'timezone' => 'UTC',
                    'language' => 'en',
                    'maintenanceMode' => false,
                ];

            case 'notifications':
                return [
                    'emailNotifications' => true,
                    'pushNotifications' => true,
                    'weeklyReports' => true,
                    'securityAlerts' => true,
                    'marketingEmails' => false,
                ];

            case 'security':
                return [
                    'twoFactorAuth' => false,
                    'sessionTimeout' => '24',
                    'passwordExpiry' => '90',
                    'loginAttempts' => '5',
                    'ipWhitelist' => '',
                ];

            case 'api':
                return [
                    'rateLimit' => '1000',
                    'apiVersion' => 'v1',
                    'webhookUrl' => '',
                    'corsOrigins' => '*',
                    'apiLogging' => true,
                ];

            case 'email':
                return [
                    'smtpHost' => '',
                    'smtpPort' => '587',
                    'smtpUsername' => '',
                    'smtpPassword' => '',
                    'fromEmail' => '',
                    'fromName' => '',
                    'encryption' => 'tls',
                ];

            case 'appearance':
                return [
                    'theme' => 'light',
                    'primaryColor' => '#3b82f6',
                    'secondaryColor' => '#10b981',
                    'fontFamily' => 'Inter, sans-serif',
                    'borderRadius' => '0.375rem',
                ];

            default:
                return [];
        }
    }
}
