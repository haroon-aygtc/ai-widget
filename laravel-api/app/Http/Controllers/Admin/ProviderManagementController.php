<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AI\AIServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProviderManagementController extends Controller
{
    /**
     * Get available provider templates for admin management.
     */
    public function getProviderTemplates(): JsonResponse
    {
        $templates = AIServiceFactory::getAvailableProviders();
        
        return response()->json([
            'success' => true,
            'data' => $templates,
            'source' => $this->getProviderSource(),
        ]);
    }

    /**
     * Get default provider templates.
     */
    public function getDefaultTemplates(): JsonResponse
    {
        $templates = AIServiceFactory::getDefaultProviderTemplates();
        
        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Update provider templates (admin only).
     */
    public function updateProviderTemplates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'providers' => 'required|array',
            'providers.*' => 'required|array',
            'providers.*.name' => 'required|string',
            'providers.*.description' => 'required|string',
            'providers.*.logo' => 'required|string',
            'providers.*.supported_features' => 'array',
            'providers.*.models' => 'array',
            'providers.*.api_endpoint' => 'nullable|url',
            'providers.*.documentation_url' => 'nullable|url',
            'providers.*.pricing_info' => 'nullable|string',
        ]);

        try {
            // Store the provider templates in system settings
            SystemSetting::updateOrCreate(
                ['key' => 'available_providers'],
                [
                    'value' => $validated['providers'],
                    'type' => 'array',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Provider templates updated successfully',
                'data' => $validated['providers'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update provider templates: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset provider templates to defaults.
     */
    public function resetProviderTemplates(): JsonResponse
    {
        try {
            $defaultTemplates = AIServiceFactory::getDefaultProviderTemplates();
            
            SystemSetting::updateOrCreate(
                ['key' => 'available_providers'],
                [
                    'value' => $defaultTemplates,
                    'type' => 'array',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Provider templates reset to defaults',
                'data' => $defaultTemplates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset provider templates: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add a new provider template.
     */
    public function addProviderTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider_type' => 'required|string|unique_provider_type',
            'name' => 'required|string',
            'description' => 'required|string',
            'logo' => 'required|string',
            'supported_features' => 'array',
            'models' => 'array',
            'api_endpoint' => 'nullable|url',
            'documentation_url' => 'nullable|url',
            'pricing_info' => 'nullable|string',
        ]);

        try {
            $currentTemplates = AIServiceFactory::getAvailableProviders();
            $currentTemplates[$validated['provider_type']] = [
                'name' => $validated['name'],
                'description' => $validated['description'],
                'logo' => $validated['logo'],
                'supported_features' => $validated['supported_features'] ?? [],
                'models' => $validated['models'] ?? [],
                'api_endpoint' => $validated['api_endpoint'],
                'documentation_url' => $validated['documentation_url'],
                'pricing_info' => $validated['pricing_info'],
            ];

            SystemSetting::updateOrCreate(
                ['key' => 'available_providers'],
                [
                    'value' => $currentTemplates,
                    'type' => 'array',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Provider template added successfully',
                'data' => $currentTemplates[$validated['provider_type']],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add provider template: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a provider template.
     */
    public function removeProviderTemplate(string $providerType): JsonResponse
    {
        try {
            $currentTemplates = AIServiceFactory::getAvailableProviders();
            
            if (!isset($currentTemplates[$providerType])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider template not found',
                ], 404);
            }

            unset($currentTemplates[$providerType]);

            SystemSetting::updateOrCreate(
                ['key' => 'available_providers'],
                [
                    'value' => $currentTemplates,
                    'type' => 'array',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Provider template removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove provider template: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the source of current provider templates.
     */
    private function getProviderSource(): string
    {
        try {
            $setting = SystemSetting::where('key', 'available_providers')->first();
            return $setting ? 'database' : 'defaults';
        } catch (\Exception $e) {
            return 'defaults';
        }
    }

    /**
     * Export provider templates configuration.
     */
    public function exportTemplates(): JsonResponse
    {
        $templates = AIServiceFactory::getAvailableProviders();
        
        return response()->json([
            'success' => true,
            'data' => $templates,
            'exported_at' => now()->toISOString(),
            'source' => $this->getProviderSource(),
        ]);
    }

    /**
     * Import provider templates configuration.
     */
    public function importTemplates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'templates' => 'required|array',
            'overwrite' => 'boolean',
        ]);

        try {
            $currentTemplates = $validated['overwrite'] ? [] : AIServiceFactory::getAvailableProviders();
            $importedTemplates = array_merge($currentTemplates, $validated['templates']);

            SystemSetting::updateOrCreate(
                ['key' => 'available_providers'],
                [
                    'value' => $importedTemplates,
                    'type' => 'array',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Provider templates imported successfully',
                'data' => $importedTemplates,
                'imported_count' => count($validated['templates']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to import provider templates: ' . $e->getMessage(),
            ], 500);
        }
    }
}
