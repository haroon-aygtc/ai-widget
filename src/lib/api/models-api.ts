import api from "./api";
import { ApiResponse } from "./ai-provider-api";

/**
 * AIModel data type matching the backend model structure
 */
export interface AIModel {
    id?: number;
    name: string;
    model_id: string;
    provider_type: string;
    ai_provider_id?: string;
    description?: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    capabilities?: Record<string, any>;
    configuration?: Record<string, any>;
    is_active?: boolean;
    is_featured?: boolean;
}

/**
 * Data shape for testing an AI model
 */
export interface TestModelData {
    provider: string;
    model_id: string;
    api_key: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
}

/**
 * Data shape for fetching available models
 */
export interface FetchModelsData {
    provider: string;
    api_key: string;
}

/**
 * Class to handle all API calls related to AI models
 */
class AIModelApi {
    /**
     * Get all AI models with optional filtering
     */
    async getAll(params?: Record<string, any>): Promise<ApiResponse<AIModel[]>> {
        try {
            const response = await api.get("/ai-models", { params });
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch AI models");
            return { success: false, message: "Failed to fetch models" };
        }
    }

    /**
     * Get a specific AI model by ID
     */
    async getById(id: string | number): Promise<ApiResponse<AIModel>> {
        try {
            const response = await api.get(`/ai-models/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch AI model with ID ${id}`);
            return { success: false, message: "Model not found" };
        }
    }

    /**
     * Create a new AI model
     */
    async create(data: AIModel): Promise<ApiResponse<AIModel>> {
        try {
            const response = await api.post("/ai-models", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to create AI model");
            return { success: false, message: "Failed to create model" };
        }
    }

    /**
     * Update an existing AI model
     */
    async update(id: string | number, data: Partial<AIModel>): Promise<ApiResponse<AIModel>> {
        try {
            const response = await api.put(`/ai-models/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to update AI model with ID ${id}`);
            return { success: false, message: "Failed to update model" };
        }
    }

    /**
     * Delete an AI model
     */
    async delete(id: string | number): Promise<ApiResponse<null>> {
        try {
            const response = await api.delete(`/ai-models/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to delete AI model with ID ${id}`);
            return { success: false, message: "Failed to delete model" };
        }
    }

    /**
     * Fetch available models for a provider
     */
    async fetchAvailableModels(data: FetchModelsData): Promise<ApiResponse<{
        models: Array<{ id: string; name: string; } | string>;
    }>> {
        try {
            const response = await api.post("/ai-models/fetch-available", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch available models");
            return { success: false, message: "Failed to fetch available models" };
        }
    }

    /**
     * Test an AI model
     */
    async testModel(data: TestModelData): Promise<ApiResponse<{
        content: string;
        response_time?: number;
        usage?: Record<string, any>;
    }>> {
        try {
            const response = await api.post("/ai-models/test-model", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to test model");
            return { success: false, message: "Model test failed" };
        }
    }

    /**
     * Toggle model active status
     */
    async toggleActive(id: string | number): Promise<ApiResponse<AIModel>> {
        try {
            const response = await api.patch(`/ai-models/${id}/toggle-active`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to toggle active status for model with ID ${id}`);
            return { success: false, message: "Failed to toggle model status" };
        }
    }

    /**
     * Toggle model featured status
     */
    async toggleFeatured(id: string | number): Promise<ApiResponse<AIModel>> {
        try {
            const response = await api.patch(`/ai-models/${id}/toggle-featured`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to toggle featured status for model with ID ${id}`);
            return { success: false, message: "Failed to toggle featured status" };
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

        console.error(`AI Model API Error: ${errorMessage}`, error);
    }
}

// Export a singleton instance
export const aiModelApi = new AIModelApi();

// Export default for direct import
export default aiModelApi; 