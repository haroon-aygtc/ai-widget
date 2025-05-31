import api from "./api";

interface AIModelData {
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

interface TestModelData {
  provider: string;
  model_id: string;
  api_key: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

interface FetchModelsData {
  provider: string;
  api_key: string;
}

// AI Model API
export const aiModelApi = {
  getAll: (params?: Record<string, any>) => api.get("/ai-models", { params }),
  getById: (id: string) => api.get(`/ai-models/${id}`),
  create: (data: AIModelData) => api.post("/ai-models", data),
  update: (id: string, data: AIModelData) => api.put(`/ai-models/${id}`, data),
  delete: (id: string) => api.delete(`/ai-models/${id}`),
  fetchAvailableModels: (data: FetchModelsData) =>
    api.post("/ai-models/fetch-available", data),
  testModel: (data: TestModelData) => api.post("/ai-models/test-model", data),
  toggleActive: (id: string) => api.patch(`/ai-models/${id}/toggle-active`),
  toggleFeatured: (id: string) => api.patch(`/ai-models/${id}/toggle-featured`),
};

export default aiModelApi;
