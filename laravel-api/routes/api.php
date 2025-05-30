<?php

use App\Http\Controllers\API\AIProviderController;
use App\Http\Controllers\API\ChatController;
use App\Http\Controllers\API\WidgetController;
use Illuminate\Http\Request;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// AI Provider routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('ai-providers', AIProviderController::class);
    Route::post('ai-providers/test-connection', [AIProviderController::class, 'testConnection']);
    Route::post('ai-providers/generate-response', [AIProviderController::class, 'generateResponse']);
    
    // Widget routes
    Route::apiResource('widgets', WidgetController::class);
    Route::post('widgets/{widget}/generate-embed-code', [WidgetController::class, 'generateEmbedCode']);
    
    // Chat routes
    Route::get('chats', [ChatController::class, 'index']);
    Route::get('chats/{sessionId}', [ChatController::class, 'getBySession']);
    Route::post('chats/send-message', [ChatController::class, 'sendMessage']);
});

// Public routes for the widget
Route::prefix('widget')->group(function () {
    Route::get('{embedCode}', [WidgetController::class, 'getWidgetConfig']);
    Route::post('{embedCode}/send-message', [ChatController::class, 'sendPublicMessage']);
});
