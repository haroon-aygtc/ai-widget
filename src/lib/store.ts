import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { aiProviderApi, widgetApi } from './api';

// Types
export interface AIProvider {
  [x: string]: ReactNode;
  provider_type: ReactNode;
  id?: string;
  provider: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  advancedSettings: {
    streamResponse: boolean;
    contextWindow: number;
    topP: number;
  };
}

export interface Widget {
  description: string;
  ai_provider_id: string;
  id?: string;
  name: string;
  design: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
    headerText: string;
    buttonText: string;
    placeholderText: string;
    position: string;
  };
  behavior: {
    initialMessage: string;
    typingIndicator: boolean;
    showTimestamp: boolean;
    autoResponse: boolean;
    responseDelay: number;
    maxMessages: number;
    aiProvider: string;
    welcomeMessage: string;
  };
  placement: {
    position: string;
    offsetX: number;
    offsetY: number;
    mobilePosition: string;
    showOnPages: string;
    excludePages: string;
    triggerType: string;
    triggerText: string;
    triggerIcon: string;
  };
  status: string;
}

interface AIProviderState {
  providers: AIProvider[];
  isLoading: boolean;
  error: string | null;
  fetchProviders: () => Promise<void>;
  createProvider: (provider: AIProvider) => Promise<void>;
  updateProvider: (id: string, provider: AIProvider) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  testConnection: (provider: Pick<AIProvider, 'provider' | 'apiKey'>) => Promise<boolean>;
  clearError: () => void;
}

interface WidgetState {
  widgets: Widget[];
  currentWidget: Widget | null;
  isLoading: boolean;
  error: string | null;
  fetchWidgets: () => Promise<void>;
  createWidget: (widget: Widget) => Promise<void>;
  updateWidget: (id: string, widget: Widget) => Promise<void>;
  deleteWidget: (id: string) => Promise<void>;
  setCurrentWidget: (widget: Widget | null) => void;
  generateEmbedCode: (id: string) => Promise<string>;
  clearError: () => void;
}

// AI Provider Store
export const useAIProviderStore = create<AIProviderState>(
  (set, get) => ({
    providers: [],
    isLoading: false,
    error: null,
    fetchProviders: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await aiProviderApi.getAll();
        set({ providers: response.data, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch AI providers',
          isLoading: false,
        });
      }
    },
    createProvider: async (provider) => {
      set({ isLoading: true, error: null });
      try {
        const response = await aiProviderApi.create(provider);
        set(state => ({
          providers: [...state.providers, response.data],
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create AI provider',
          isLoading: false,
        });
      }
    },
    updateProvider: async (id, provider) => {
      set({ isLoading: true, error: null });
      try {
        const response = await aiProviderApi.update(id, provider);
        set(state => ({
          providers: state.providers.map(p => (p.id === id ? response.data : p)),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update AI provider',
          isLoading: false,
        });
      }
    },
    deleteProvider: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await aiProviderApi.delete(id);
        set(state => ({
          providers: state.providers.filter(p => p.id !== id),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete AI provider',
          isLoading: false,
        });
      }
    },
    testConnection: async (provider) => {
      set({ isLoading: true, error: null });
      try {
        const response = await aiProviderApi.testConnection(provider);
        set({ isLoading: false });
        return response.data.success;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Connection test failed',
          isLoading: false,
        });
        return false;
      }
    },
    clearError: () => set({ error: null }),
  })
);

// Widget Store
export const useWidgetStore = create<WidgetState>(
  (set, get) => ({
    widgets: [],
    currentWidget: null,
    isLoading: false,
    error: null,
    fetchWidgets: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await widgetApi.getAll();
        // Ensure response.data is an array
        const widgetsData = Array.isArray(response.data) ? response.data : [];
        set({ widgets: widgetsData, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch widgets',
          isLoading: false,
          widgets: [], // Reset to empty array on error
        });
      }
    },
    createWidget: async (widget) => {
      set({ isLoading: true, error: null });
      try {
        const response = await widgetApi.create(widget);
        set(state => ({
          widgets: Array.isArray(state.widgets) ? [...state.widgets, response.data] : [response.data],
          currentWidget: response.data,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create widget',
          isLoading: false,
        });
      }
    },
    updateWidget: async (id, widget) => {
      set({ isLoading: true, error: null });
      try {
        const response = await widgetApi.update(id, widget);
        set(state => ({
          widgets: Array.isArray(state.widgets)
            ? state.widgets.map(w => (w.id === id ? response.data : w))
            : [response.data],
          currentWidget: response.data,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update widget',
          isLoading: false,
        });
      }
    },
    deleteWidget: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await widgetApi.delete(id);
        set(state => ({
          widgets: Array.isArray(state.widgets)
            ? state.widgets.filter(w => w.id !== id)
            : [],
          currentWidget: state.currentWidget?.id === id ? null : state.currentWidget,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete widget',
          isLoading: false,
        });
      }
    },
    setCurrentWidget: (widget) => set({ currentWidget: widget }),
    generateEmbedCode: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await widgetApi.generateEmbedCode(id);
        set({ isLoading: false });
        return response.data.embed_code || '';
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to generate embed code',
          isLoading: false,
        });
        return '';
      }
    },
    clearError: () => set({ error: null }),
  })
);
