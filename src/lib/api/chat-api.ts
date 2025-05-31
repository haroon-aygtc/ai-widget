import api from "./api";
import { ApiResponse } from "./ai-provider-api";

/**
 * Chat message data type
 */
export interface ChatMessageData {
    session_id: string;
    message: string;
    widget_id?: string;
    user_data?: Record<string, any>;
}

/**
 * Message type
 */
export interface Message {
    id: string;
    session_id: string;
    message: string;
    response: string;
    sender_type: "user" | "ai";
    created_at: string;
    updated_at: string;
}

/**
 * Class to handle all API calls related to chat
 */
class ChatApi {
    /**
     * Get all chat sessions
     */
    async getAll(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get("/chats");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch chat sessions");
            return { success: false, message: "Failed to fetch chat sessions" };
        }
    }

    /**
     * Get chat history by session ID
     */
    async getBySession(sessionId: string): Promise<ApiResponse<Message[]>> {
        try {
            const response = await api.get(`/chats/${sessionId}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch chat history for session ${sessionId}`);
            return { success: false, message: "Failed to fetch chat history" };
        }
    }

    /**
     * Send a message to the AI
     */
    async sendMessage(data: ChatMessageData): Promise<ApiResponse<any>> {
        try {
            const response = await api.post("/chats/send-message", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to send message");
            return { success: false, message: "Failed to send message" };
        }
    }

    /**
     * Stream a message to the AI
     */
    async streamMessage(data: ChatMessageData) {
        try {
            return api.post("/chat/stream", data, {
                responseType: 'stream'
            });
        } catch (error) {
            this.handleError(error, "Failed to stream message");
            throw error;
        }
    }

    /**
     * Get available providers for chat
     */
    async getAvailableProviders(): Promise<ApiResponse<any[]>> {
        try {
            const response = await api.get("/chat/providers");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch available providers for chat");
            return { success: false, message: "Failed to fetch available providers" };
        }
    }

    /**
     * Test a provider
     */
    async testProvider(providerId: string, testMessage?: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.post("/chat/test-provider", {
                provider_id: providerId,
                test_message: testMessage
            });
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to test provider");
            return { success: false, message: "Failed to test provider" };
        }
    }

    /**
     * Get provider statistics
     */
    async getProviderStats(): Promise<ApiResponse<any>> {
        try {
            const response = await api.get("/chat/stats");
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch provider statistics");
            return { success: false, message: "Failed to fetch provider statistics" };
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

        console.error(`Chat API Error: ${errorMessage}`, error);
    }
}

// Export a singleton instance
export const chatApi = new ChatApi();

// Export default for direct import
export default chatApi; 