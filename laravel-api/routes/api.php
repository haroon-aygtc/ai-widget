<?php

use App\Http\Controllers\API\AIProviderController;
use App\Http\Controllers\API\AIModelController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ChatController;
use App\Http\Controllers\API\WidgetController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ApiTestingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // User management routes
    Route::apiResource('users', UserController::class);
    Route::patch('users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

    // Settings routes
    Route::get('settings/{type}', [SettingsController::class, 'get']);
    Route::post('settings', [SettingsController::class, 'update']);

    // API Testing routes
    Route::get('api-discovery', [ApiTestingController::class, 'discoverEndpoints']);
    Route::post('api-execute', [ApiTestingController::class, 'executeRequest']);

    // Admin Provider Template Management
    Route::prefix('admin/providers')->group(function () {
        Route::get('templates', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'getProviderTemplates']);
        Route::get('templates/defaults', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'getDefaultTemplates']);
        Route::post('templates', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'updateProviderTemplates']);
        Route::post('templates/reset', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'resetProviderTemplates']);
        Route::post('templates/add', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'addProviderTemplate']);
        Route::delete('templates/{providerType}', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'removeProviderTemplate']);
        Route::get('templates/export', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'exportTemplates']);
        Route::post('templates/import', [\App\Http\Controllers\Admin\ProviderManagementController::class, 'importTemplates']);
    });

    // AI Provider Management routes
    Route::prefix('ai-providers')->group(function () {
        Route::get('/', [AIProviderController::class, 'index']);
        Route::post('/', [AIProviderController::class, 'store']);
        Route::post('/test-connection', [AIProviderController::class, 'testConnection']);
        Route::post('/models', [AIProviderController::class, 'getModels']);
        Route::patch('/{provider}/toggle-status', [AIProviderController::class, 'toggleStatus']);
        Route::delete('/{provider}', [AIProviderController::class, 'destroy']);
    });

    // AI Model Management routes
    Route::apiResource('ai-models', AIModelController::class);
    Route::post('ai-models/fetch-available', [AIModelController::class, 'fetchAvailableModels']);
    Route::post('ai-models/test-model', [AIModelController::class, 'testModel']);
    Route::patch('ai-models/{id}/toggle-active', [AIModelController::class, 'toggleActive']);
    Route::patch('ai-models/{id}/toggle-featured', [AIModelController::class, 'toggleFeatured']);

    // Chat routes
    Route::prefix('chat')->group(function () {
        Route::post('/message', [ChatController::class, 'sendMessage']);
        Route::post('/stream', [ChatController::class, 'streamMessage']);
        Route::get('/providers', [ChatController::class, 'getAvailableProviders']);
        Route::post('/test-provider', [ChatController::class, 'testProvider']);
        Route::get('/stats', [ChatController::class, 'getProviderStats']);
    });

    // Widget routes
    Route::apiResource('widgets', WidgetController::class);
    Route::post('widgets/{widget}/generate-embed-code', [WidgetController::class, 'generateEmbedCode']);

    // Analytics routes
    Route::get('analytics/widgets/{widgetId?}', [WidgetController::class, 'getAnalytics']);
    Route::get('analytics/conversations', [ChatController::class, 'getConversationAnalytics']);
    Route::get('analytics/user-engagement', [ChatController::class, 'getUserEngagementAnalytics']);
});

// Public routes for the widget
Route::prefix('widget')->middleware('throttle:widget,120,1')->group(function () {
    Route::get('{embedCode}', [WidgetController::class, 'getConfig']);
    Route::post('{embedCode}/send-message', [ChatController::class, 'sendMessage'])
        ->middleware('throttle:30,1'); // 30 messages per minute for public widget
});
