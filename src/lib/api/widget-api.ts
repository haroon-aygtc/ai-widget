import api from "./api";
import { ApiResponse } from "./ai-provider-api";

/**
 * Widget data type
 */
export interface WidgetData {
    name?: string;
    description?: string;
    ai_provider_id?: string;
    theme?: Record<string, any>;
    settings?: Record<string, any>;
    is_active?: boolean;
}

/**
 * Widget type
 */
export interface Widget {
    id: number;
    name: string;
    description?: string;
    ai_provider_id: number;
    theme: Record<string, any>;
    settings: Record<string, any>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Class to handle all API calls related to widgets
 */
class WidgetApi {
    /**
     * Get all widgets
     */
    async getAll(): Promise<ApiResponse<Widget[]>> {
        try {
            const response = await api.get("/widgets");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch widgets");
            return { success: false, message: "Failed to fetch widgets" };
        }
    }

    /**
     * Get a specific widget by ID
     */
    async getById(id: string | number): Promise<ApiResponse<Widget>> {
        try {
            const response = await api.get(`/widgets/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch widget with ID ${id}`);
            return { success: false, message: "Widget not found" };
        }
    }

    /**
     * Create a new widget
     */
    async create(data: WidgetData): Promise<ApiResponse<Widget>> {
        try {
            const response = await api.post("/widgets", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to create widget");
            return { success: false, message: "Failed to create widget" };
        }
    }

    /**
     * Update an existing widget
     */
    async update(id: string | number, data: Partial<WidgetData>): Promise<ApiResponse<Widget>> {
        try {
            const response = await api.put(`/widgets/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to update widget with ID ${id}`);
            return { success: false, message: "Failed to update widget" };
        }
    }

    /**
     * Delete a widget
     */
    async delete(id: string | number): Promise<ApiResponse<null>> {
        try {
            const response = await api.delete(`/widgets/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to delete widget with ID ${id}`);
            return { success: false, message: "Failed to delete widget" };
        }
    }

    /**
     * Generate embed code for a widget
     */
    async generateEmbedCode(id: string | number): Promise<ApiResponse<{ embed_code: string }>> {
        try {
            const response = await api.post(`/widgets/${id}/generate-embed-code`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to generate embed code for widget with ID ${id}`);
            return { success: false, message: "Failed to generate embed code" };
        }
    }

    /**
     * Get widget analytics
     */
    async getAnalytics(widgetId?: string | number): Promise<ApiResponse<any>> {
        try {
            const endpoint = widgetId
                ? `/analytics/widgets/${widgetId}`
                : '/analytics/widgets';
            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch widget analytics");
            return { success: false, message: "Failed to fetch widget analytics" };
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

        console.error(`Widget API Error: ${errorMessage}`, error);
    }
}

// Export a singleton instance
export const widgetApi = new WidgetApi();

// Export default for direct import
export default widgetApi; 