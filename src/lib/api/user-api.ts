import api from "./api";
import { ApiResponse } from "./ai-provider-api";

/**
 * User data type
 */
export interface UserData {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role?: "admin" | "user";
    status?: "active" | "inactive";
}

/**
 * User type
 */
export interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
}

/**
 * Class to handle all API calls related to users
 */
class UserApi {
    /**
     * Get all users
     */
    async getAll(params?: Record<string, any>): Promise<ApiResponse<User[]>> {
        try {
            const response = await api.get("/users", { params });
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to fetch users");
            return { success: false, message: "Failed to fetch users" };
        }
    }

    /**
     * Get a specific user by ID
     */
    async getById(id: string | number): Promise<ApiResponse<User>> {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to fetch user with ID ${id}`);
            return { success: false, message: "User not found" };
        }
    }

    /**
     * Create a new user
     */
    async create(data: UserData): Promise<ApiResponse<User>> {
        try {
            const response = await api.post("/users", data);
            return response.data;
        } catch (error) {
            this.handleError(error, "Failed to create user");
            return { success: false, message: "Failed to create user" };
        }
    }

    /**
     * Update an existing user
     */
    async update(id: string | number, data: Partial<UserData>): Promise<ApiResponse<User>> {
        try {
            const response = await api.put(`/users/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to update user with ID ${id}`);
            return { success: false, message: "Failed to update user" };
        }
    }

    /**
     * Delete a user
     */
    async delete(id: string | number): Promise<ApiResponse<null>> {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to delete user with ID ${id}`);
            return { success: false, message: "Failed to delete user" };
        }
    }

    /**
     * Toggle user status
     */
    async toggleStatus(id: string | number): Promise<ApiResponse<User>> {
        try {
            const response = await api.patch(`/users/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            this.handleError(error, `Failed to toggle status for user with ID ${id}`);
            return { success: false, message: "Failed to toggle user status" };
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

        console.error(`User API Error: ${errorMessage}`, error);
    }
}

// Export a singleton instance
export const userApi = new UserApi();

// Export default for direct import
export default userApi; 