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

// AI Provider API
export const aiProviderApi = {
  getAll: () => api.get("/ai-providers"),
  getById: (id: string) => api.get(`/ai-providers/${id}`),
  create: (data: any) => api.post("/ai-providers", data),
  update: (id: string, data: any) => api.put(`/ai-providers/${id}`, data),
  delete: (id: string) => api.delete(`/ai-providers/${id}`),
  testConnection: (data: any) =>
    api.post("/ai-providers/test-connection", data),
  generateResponse: (data: any) =>
    api.post("/ai-providers/generate-response", data),
};

// Widget API
export const widgetApi = {
  getAll: () => api.get("/widgets"),
  getById: (id: string) => api.get(`/widgets/${id}`),
  create: (data: any) => api.post("/widgets", data),
  update: (id: string, data: any) => api.put(`/widgets/${id}`, data),
  delete: (id: string) => api.delete(`/widgets/${id}`),
  generateEmbedCode: (id: string) =>
    api.post(`/widgets/${id}/generate-embed-code`),
};

// Chat API
export const chatApi = {
  getAll: () => api.get("/chats"),
  getBySession: (sessionId: string) => api.get(`/chats/${sessionId}`),
  sendMessage: (data: any) => api.post("/chats/send-message", data),
};

export default api;
