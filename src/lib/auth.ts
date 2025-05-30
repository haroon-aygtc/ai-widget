import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  logout: () => void;
  clearError: () => void;
}

// Mock API calls - replace with actual API calls in production
const mockLogin = async (email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation
  if (email === "admin@example.com" && password === "password") {
    return {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    };
  } else if (email === "user@example.com" && password === "password") {
    return {
      id: "2",
      name: "Regular User",
      email: "user@example.com",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
    };
  }

  throw new Error("Invalid credentials");
};

const mockRegister = async (
  name: string,
  email: string,
  password: string,
): Promise<User> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation
  if (email === "admin@example.com" || email === "user@example.com") {
    throw new Error("Email already in use");
  }

  // Mock successful registration
  return {
    id: "3",
    name,
    email,
    role: "user",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.toLowerCase().replace(/\s+/g, "")}`,
  };
};

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
          const user = await mockLogin(email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            isLoading: false,
          });
        }
      },
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await mockRegister(name, email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            isLoading: false,
          });
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
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
