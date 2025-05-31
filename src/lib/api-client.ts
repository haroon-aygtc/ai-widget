/**
 * API Client module - centralizes all API access
 * 
 * This module imports and re-exports all API functionality from various modules
 * and can be safely imported directly in components.
 */

// Import the base API client
import api from './api/api';

// Rename for consistency with exports
const apiClient = api;

// Import the provider API client
import { type AIProvider, type TestConnectionData, type ApiResponse, aiProviderApi } from './api/ai-provider-api';

// Import the model API client
import { type AIModel, type TestModelData, type FetchModelsData, aiModelApi } from './api/models-api';

// Import the chat API client
import { type ChatMessageData, type Message, chatApi } from './api/chat-api';

// Import the widget API client
import { type WidgetData, type Widget, widgetApi } from './api/widget-api';

// Import the user API client
import { type UserData, type User, userApi } from './api/user-api';

// Import the API testing client
import { type ApiRequestData, apiTestingApi } from './api/api-testing-api';

// Re-export everything
export {
    apiClient,
    aiProviderApi,
    aiModelApi,
    chatApi,
    widgetApi,
    userApi,
    apiTestingApi,
    // Types
    type AIProvider,
    type AIModel,
    type TestConnectionData,
    type TestModelData,
    type FetchModelsData,
    type ApiResponse,
    type ChatMessageData,
    type Message,
    type WidgetData,
    type Widget,
    type UserData,
    type User,
    type ApiRequestData
};

// Export a default object with all clients
export default apiClient; 