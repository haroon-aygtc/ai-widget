import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const useAuth = create<AuthState>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/login`, {
            email,
            password,
          });

          const { user, token } = response.data;

          // Store token in localStorage
          localStorage.setItem("auth-token", token);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error.response?.data?.message ||
              "Login failed. Please check your credentials.",
            isLoading: false,
          });
        }
      },
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/register`, {
            name,
            email,
            password,
            password_confirmation: password, // Laravel requires this for validation
          });

          const { user, token } = response.data;

          // Store token in localStorage
          localStorage.setItem("auth-token", token);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error.response?.data?.message ||
              "Registration failed. Please try again.",
            isLoading: false,
          });
        }
      },
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem("auth-token");

          if (token) {
            await axios.post(
              `${API_URL}/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          }

          // Remove token from localStorage
          localStorage.removeItem("auth-token");

          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
          // Even if the API call fails, we should still log out the user locally
          localStorage.removeItem("auth-token");
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Logout failed, but you've been logged out locally.",
          });
        }
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
