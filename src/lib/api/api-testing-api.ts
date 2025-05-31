import api from "./api";
import { ApiResponse } from "./ai-provider-api";

/**
 * API request data type
 */
export interface ApiRequestData {
    method: string;
    endpoint: string;
    headers?: Record<string, string>;
    body?: any;
}

/**
 * Class to handle all API calls related to API testing
 */
class ApiTestingApi {
    /**
     * Discover available endpoints
     */
    async discoverEndpoints(): Promise<ApiResponse<{ endpoints: any[] }>> {
        try {
            const response = await api.get("/api-discovery");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to discover endpoints");
            return { success: false, message: "Failed to discover endpoints" };
        }
    }

    /**
     * Execute a request
     */
    async executeRequest(data: ApiRequestData): Promise<ApiResponse<any>> {
        try {
            const response = await api.post("/api-execute", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to execute request");
            return { success: false, message: "Failed to execute request" };
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

        console.error(`API Testing Error: ${errorMessage}`, error);
    }
}

// Export a singleton instance
export const apiTestingApi = new ApiTestingApi();

// Export default for direct import
export default apiTestingApi; 