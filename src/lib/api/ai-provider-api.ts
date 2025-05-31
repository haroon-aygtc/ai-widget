import api from "./api";

/**
 * AIProvider data type matching the backend model structure
 */
export interface AIProvider {
    id?: number;
    user_id?: number;
    provider_type: string;
    name: string;
    api_key: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    advanced_settings?: Record<string, any>;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Data shape for testing an AI provider connection
 */
export interface TestConnectionData {
    provider_type: string;
    api_key: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
}

/**
 * Response shape for API requests
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Class to handle all API calls related to AI providers
 */
class AIProviderApi {
    /**
     * Get all AI providers including available provider types
     */
    async getAll(): Promise<ApiResponse<{
        configured_providers: AIProvider[];
        available_types: Record<string, any>;
    }>> {
        try {
            const response = await api.get("/ai-providers");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch AI providers");
            return { success: false, message: "Failed to fetch AI providers" };
        }
    }

    /**
     * Get a specific AI provider by ID
     */
    async getById(id: string | number): Promise<ApiResponse<AIProvider>> {
        try {
            const response = await api.get(`/ai-providers/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch AI provider with ID ${id}`);
            return { success: false, message: `Provider not found` };
        }
    }

    /**
     * Create a new AI provider
     */
    async create(data: AIProvider): Promise<ApiResponse<AIProvider>> {
        try {
            const response = await api.post("/ai-providers", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to create AI provider");
            return { success: false, message: "Failed to create provider" };
        }
    }

    /**
     * Update an existing AI provider
     */
    async update(id: string | number, data: Partial<AIProvider>): Promise<ApiResponse<AIProvider>> {
        try {
            const response = await api.put(`/ai-providers/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to update AI provider with ID ${id}`);
            return { success: false, message: "Failed to update provider" };
        }
    }

    /**
     * Delete an AI provider
     */
    async delete(id: string | number): Promise<ApiResponse<null>> {
        try {
            const response = await api.delete(`/ai-providers/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to delete AI provider with ID ${id}`);
            return { success: false, message: "Failed to delete provider" };
        }
    }

    /**
     * Toggle provider active status
     */
    async toggleStatus(id: string | number): Promise<ApiResponse<AIProvider>> {
        try {
            const response = await api.patch(`/ai-providers/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to toggle status for provider with ID ${id}`);
            return { success: false, message: "Failed to toggle provider status" };
        }
    }

    /**
     * Test connection to an AI provider
     */
    async testConnection(data: TestConnectionData): Promise<ApiResponse<any>> {
        try {
            const response = await api.post("/ai-providers/test-connection", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to test provider connection");
            return { success: false, message: "Connection test failed" };
        }
    }

    /**
     * Get available models for a provider type
     */
    async getModels(providerType: string): Promise<ApiResponse<{
        provider: string;
        models: string[];
    }>> {
        try {
            const response = await api.get(`/ai-providers/${providerType}/models`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch models for provider ${providerType}`);
            return { success: false, message: "Failed to fetch models" };
        }
    }

    /**
     * Handle API errors consistently
     */
    private handleError(error: any, defaultMessage: string): void {
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            defaultMessage;

        console.error(`AI Provider API Error: ${errorMessage}`, error);

        // You could implement additional error handling here
        // like logging to a service or showing notifications
    }
}

// Export a singleton instance
export const aiProviderApi = new AIProviderApi();

// Export default for direct import
export default aiProviderApi; 