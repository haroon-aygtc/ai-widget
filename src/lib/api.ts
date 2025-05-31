import axios from "axios";

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

interface AIProviderData {
  provider_type?: string;
  api_key?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  advanced_settings?: Record<string, any>;
  is_active?: boolean;
}

interface TestConnectionData {
  provider: string;
  apiKey: string;
}

interface GenerateResponseData {
  provider: string;
  message: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  advancedSettings?: Record<string, any>;
}

// AI Provider API
export const aiProviderApi = {
  getAll: () => api.get("/ai-providers"),
  getById: (id: string) => api.get(`/ai-providers/${id}`),
  create: (data: AIProviderData) => api.post("/ai-providers", data),
  update: (id: string, data: AIProviderData) =>
    api.put(`/ai-providers/${id}`, data),
  delete: (id: string) => api.delete(`/ai-providers/${id}`),
  testConnection: (data: TestConnectionData) =>
    api.post("/ai-providers/test-connection", data),
  generateResponse: (data: GenerateResponseData) =>
    api.post("/ai-providers/generate-response", data),
  getAvailableProviders: () => api.get("/ai-providers/available"),
  getProviderConfig: (providerType: string) =>
    api.get(`/ai-providers/config/${providerType}`),
};

interface WidgetData {
  name?: string;
  description?: string;
  ai_provider_id?: string;
  theme?: Record<string, any>;
  settings?: Record<string, any>;
  is_active?: boolean;
}

// Widget API
export const widgetApi = {
  getAll: () => api.get("/widgets"),
  getById: (id: string) => api.get(`/widgets/${id}`),
  create: (data: WidgetData) => api.post("/widgets", data),
  update: (id: string, data: WidgetData) => api.put(`/widgets/${id}`, data),
  delete: (id: string) => api.delete(`/widgets/${id}`),
  generateEmbedCode: (id: string) =>
    api.post(`/widgets/${id}/generate-embed-code`),
};

interface ChatMessageData {
  session_id: string;
  message: string;
  widget_id?: string;
  user_data?: Record<string, any>;
}

// Chat API
export const chatApi = {
  getAll: () => api.get("/chats"),
  getBySession: (sessionId: string) => api.get(`/chats/${sessionId}`),
  sendMessage: (data: ChatMessageData) => api.post("/chats/send-message", data),
};

// User API
export interface UserData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
}

export const userApi = {
  getAll: (params?: Record<string, any>) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: UserData) => api.post("/users", data),
  update: (id: string, data: UserData) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`),
};

// Settings API
export interface SettingsData {
  type: string;
  settings: Record<string, any>;
}

export const settingsApi = {
  get: (type: string) => api.get(`/settings/${type}`),
  update: (data: SettingsData) => api.post("/settings", data),
};

// API Testing Tool
export interface ApiRequestData {
  method: string;
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
}

export const apiTestingService = {
  discoverEndpoints: () => api.get("/api-discovery"),
  executeRequest: (data: ApiRequestData) => api.post("/api-execute", data),
};

export default api;
