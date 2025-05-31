import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  AlertCircle,
  Settings,
  Key,
  Zap,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Loader2,
  Info,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Shield,
} from "lucide-react";

// Import API client
import { apiClient } from "@/lib/api-client";

interface AIProviderSetupProps {
  onSave?: (config: AIProviderConfig) => void;
}

interface AIProviderConfig {
  provider_type: string;
  name: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  stream_response: boolean;
  context_window: number;
  top_p: number;
  is_active: boolean;
}

const AIProviderSetup: React.FC<AIProviderSetupProps> = ({
  onSave = () => { },
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("providers");
  const [providers, setProviders] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<
    Record<string, string[]>
  >({});

  // Form state for provider configuration
  const [formData, setFormData] = useState({
    provider_type: "openai",
    api_key: "",
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: "You are a helpful assistant.",
    stream_response: true,
    context_window: 4096,
    top_p: 0.95,
    is_active: true,
  });

  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  // Load providers and available provider configs on component mount
  useEffect(() => {
    fetchProviders();
    fetchAvailableProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Call the API
      const response = await apiClient.get('/ai-providers');

      // Handle the response format
      if (response.data?.success && response.data?.configured_providers) {
        setProviders(response.data.configured_providers || []);
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setProviders([]);
      toast({
        variant: "destructive",
        title: "Error fetching providers",
        description:
          "Could not load your AI providers. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProviders = async () => {
    try {
      // Call the API - get providers from the main endpoint, not a separate available endpoint
      const response = await apiClient.get('/ai-providers');

      // Handle the response format
      if (response.data?.data?.available_types) {
        const providerConfigs = Object.entries(response.data.data.available_types).map(
          ([id, config]: [string, any]) => ({
            id,
            name: config.name,
            logo: config.logo,
            description: config.description,
            default_model: config.models?.[0] || "default-model",
            available_models: config.models || [],
            default_settings: {
              temperature: 0.7,
              max_tokens: 2048,
              system_prompt: "You are a helpful assistant.",
              stream_response: true,
              context_window: 4096,
              top_p: 0.95,
            },
            supported_features: config.supported_features || [],
          }),
        );
        setAvailableProviders(providerConfigs);
      } else {
        setAvailableProviders([]);
      }
    } catch (error) {
      console.error("Failed to fetch available providers:", error);
      setAvailableProviders([]);
      toast({
        variant: "destructive",
        title: "Error fetching available providers",
        description:
          "Could not load available AI providers. Please try again later.",
      });
    }
  };

  const fetchModelsForProvider = async (
    providerType: string,
    apiKey: string,
  ) => {
    if (!apiKey) return;

    try {
      setModelsLoading(true);
      // Call the API with the correct endpoint and method
      const response = await apiClient.post('/ai-models/fetch-available', {
        provider: providerType,
        api_key: apiKey,
      });

      // Handle the response format
      if (response.data?.models) {
        const models = response.data.models.map((model: any) =>
          typeof model === "string" ? model : model.id || model.name,
        );

        setAvailableModels((prev) => ({
          ...prev,
          [providerType]: models,
        }));

        // Update form data with first available model if current model is not in the list
        if (models.length > 0 && !models.includes(formData.model)) {
          setFormData((prev) => ({ ...prev, model: models[0] }));
        }
      } else {
        // Fallback to default models from provider config
        const providerConfig = availableProviders.find(
          (p) => p.id === providerType,
        );
        if (providerConfig?.available_models) {
          setAvailableModels((prev) => ({
            ...prev,
            [providerType]: providerConfig.available_models,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch models for provider:", error);

      // Fallback to default models from provider config
      const providerConfig = availableProviders.find(
        (p) => p.id === providerType,
      );
      if (providerConfig?.available_models) {
        setAvailableModels((prev) => ({
          ...prev,
          [providerType]: providerConfig.available_models,
        }));
      }
      toast({
        variant: "destructive",
        title: "Error fetching models",
        description:
          "Could not load models for this provider. Using default models instead.",
      });
    } finally {
      setModelsLoading(false);
    }
  };

  const getAvailableModels = (providerType: string) => {
    // First check if we have fetched models for this provider
    if (availableModels[providerType]) {
      return availableModels[providerType];
    }

    // Then check if we have a configured provider with models in advanced_settings
    const configuredProvider = providers.find(
      (p) => p.provider_type === providerType,
    );
    if (configuredProvider?.advanced_settings?.available_models) {
      return configuredProvider.advanced_settings.available_models;
    }

    // Finally, fallback to default models from available providers
    const providerConfig = availableProviders.find(
      (p) => p.id === providerType,
    );
    return providerConfig?.available_models || [];
  };

  const handleProviderSelect = (provider: any) => {
    setSelectedProvider(provider);
    setFormData({
      provider_type: provider.provider_type,
      api_key: provider.api_key,
      model: provider.model,
      temperature: provider.temperature || 0.7,
      max_tokens: provider.max_tokens || 2048,
      system_prompt: provider.system_prompt || "You are a helpful assistant.",
      stream_response: provider.advanced_settings?.stream_response ?? true,
      context_window: provider.advanced_settings?.context_window || 4096,
      top_p: provider.advanced_settings?.top_p || 0.95,
      is_active: provider.is_active,
    });
    setIsEditing(true);
    setActiveTab("configure");

    // Fetch models for this provider if we have an API key
    if (provider.api_key) {
      fetchModelsForProvider(provider.provider_type, provider.api_key);
    }
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    const defaultProvider =
      availableProviders.find((p) => p.id === "openai") ||
      availableProviders[0];
    setFormData({
      provider_type: defaultProvider?.id || "openai",
      api_key: "",
      model: defaultProvider?.default_model || "gpt-4o",
      temperature: defaultProvider?.default_settings?.temperature || 0.7,
      max_tokens: defaultProvider?.default_settings?.max_tokens || 2048,
      system_prompt:
        defaultProvider?.default_settings?.system_prompt ||
        "You are a helpful assistant.",
      stream_response:
        defaultProvider?.default_settings?.stream_response ?? true,
      context_window: defaultProvider?.default_settings?.context_window || 4096,
      top_p: defaultProvider?.default_settings?.top_p || 0.95,
      is_active: true,
    });
    setIsEditing(false);
    setActiveTab("configure");
    setTestStatus("idle");
    setTestMessage("");
  };

  const handleProviderTypeChange = async (providerType: string) => {
    try {
      // Use available provider data directly from the API
      const providerConfig = availableProviders.find(
        (p) => p.id === providerType,
      );
      if (providerConfig) {
        setFormData((prev) => ({
          ...prev,
          provider_type: providerType,
          model: providerConfig.default_model,
          temperature: providerConfig.default_settings?.temperature || 0.7,
          max_tokens: providerConfig.default_settings?.max_tokens || 2048,
          system_prompt:
            providerConfig.default_settings?.system_prompt ||
            "You are a helpful assistant.",
          stream_response:
            providerConfig.default_settings?.stream_response ?? true,
          context_window:
            providerConfig.default_settings?.context_window || 4096,
          top_p: providerConfig.default_settings?.top_p || 0.95,
        }));

        // Set available models from provider config
        setAvailableModels((prev) => ({
          ...prev,
          [providerType]: providerConfig.available_models,
        }));
      }

      // If we have an API key, fetch models for the new provider
      if (formData.api_key) {
        fetchModelsForProvider(providerType, formData.api_key);
      }
    } catch (error) {
      console.error("Failed to update provider config:", error);
      toast({
        variant: "destructive",
        title: "Error updating provider",
        description:
          "Could not update provider configuration. Please try again.",
      });
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.api_key) {
      setTestStatus("error");
      setTestMessage("API key is required");
      return;
    }

    setTestStatus("loading");
    setTestMessage("Testing connection...");

    try {
      // Call the API
      const response = await apiClient.post('/ai-providers/test-connection', {
        provider_type: formData.provider_type,
        api_key: formData.api_key,
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens
      });

      // Handle the response
      if (response.data?.success) {
        setTestStatus("success");
        setTestMessage(response.data.message || "Connection successful!");

        // Fetch available models after successful connection
        await fetchModelsForProvider(formData.provider_type, formData.api_key);

        toast({
          title: "Connection successful",
          description: "Successfully connected to the AI provider.",
          variant: "default",
        });
      } else {
        setTestStatus("error");
        setTestMessage(
          response.data?.message || "Invalid API key or connection failed"
        );

        toast({
          variant: "destructive",
          title: "Connection failed",
          description:
            response.data?.message || "Invalid API key or connection failed",
        });
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("Connection failed. Please try again.");
      console.error("Test connection error:", error);

      toast({
        variant: "destructive",
        title: "Connection error",
        description:
          "Failed to test connection. Please check your network and try again.",
      });
    }
  };

  const handleSaveConfiguration = async () => {
    const config = {
      provider_type: formData.provider_type,
      name: availableProviders.find(p => p.id === formData.provider_type)?.name || formData.provider_type,
      api_key: formData.api_key,
      model: formData.model,
      temperature: formData.temperature,
      max_tokens: formData.max_tokens,
      system_prompt: formData.system_prompt,
      advanced_settings: {
        stream_response: formData.stream_response,
        context_window: formData.context_window,
        top_p: formData.top_p,
      },
      is_active: formData.is_active,
    };

    try {
      setLoading(true);
      let response;
      if (isEditing && selectedProvider) {
        // Update existing provider
        response = await apiClient.put(`/ai-providers/${selectedProvider.id}`, config);
        if (response.data?.success) {
          toast({
            title: "Provider updated",
            description:
              "AI Provider configuration has been updated successfully.",
            variant: "default",
          });
        }
      } else {
        // Create new provider
        response = await apiClient.post('/ai-providers', config);
        if (response.data?.success) {
          toast({
            title: "Provider created",
            description: "New AI Provider has been created successfully.",
            variant: "default",
          });
        }
      }

      // Only proceed if the operation was successful
      if (response.data?.success) {
        // Refresh providers list
        await fetchProviders();

        // Call the onSave callback with the form data translated to AIProviderConfig
        onSave({
          provider_type: formData.provider_type,
          name: config.name,
          api_key: formData.api_key,
          model: formData.model,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          system_prompt: formData.system_prompt,
          stream_response: formData.stream_response,
          context_window: formData.context_window,
          top_p: formData.top_p,
          is_active: formData.is_active,
        });

        // Reset form and go back to providers tab
        setActiveTab("providers");
      } else {
        throw new Error(response.data?.message || "Failed to save configuration");
      }
    } catch (error: any) {
      console.error("Save configuration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        error.message ||
        "Failed to save configuration. Please try again.";

      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          typeof errorMessage === "string"
            ? errorMessage
            : JSON.stringify(errorMessage),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      setLoading(true);
      // Call the API
      const response = await apiClient.delete(`/ai-providers/${providerId}`);

      // Handle the response
      if (response.data?.success) {
        toast({
          title: "Provider deleted",
          description: "AI Provider has been removed successfully.",
          variant: "default",
        });

        // Refresh providers list
        await fetchProviders();
      } else {
        throw new Error(response.data?.message || "Failed to delete provider");
      }
    } catch (error: any) {
      console.error("Delete provider error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete provider. Please try again.";

      toast({
        variant: "destructive",
        title: "Delete failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteProvider = (providerId: string) => {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      handleDeleteProvider(providerId);
    }
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Provider Setup
          </h1>
          <p className="text-muted-foreground">
            Connect and configure your AI providers for chat widgets
          </p>
        </div>
        <Button onClick={handleNewProvider} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="configure" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Plus className="h-4 w-4" />
            Available
          </TabsTrigger>
        </TabsList>

        {/* Configured Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Providers</CardTitle>
              <CardDescription>
                Manage your existing AI provider configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">
                    Loading providers...
                  </span>
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No providers configured
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first AI provider to get started with chat widgets
                  </p>
                  <Button onClick={handleNewProvider} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Provider
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shadow-sm">
                          <span className="text-xl">
                            {availableProviders.find(
                              (p) => p.id === provider.provider_type,
                            )?.logo || "🤖"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold capitalize text-lg">
                              {provider.provider_type}
                            </h3>
                            <Badge
                              variant={
                                provider.is_active ? "default" : "secondary"
                              }
                              className="ml-2"
                            >
                              {provider.is_active ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Inactive
                                </span>
                              )}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Model:</span>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {provider.model}
                              </Badge>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <div>
                              {provider.last_used
                                ? `Last used: ${new Date(provider.last_used).toLocaleDateString()}`
                                : "Never used"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              API Key:
                            </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {showApiKey[provider.id]
                                ? provider.api_key
                                : provider.api_key.replace(/./g, "•")}
                            </code>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      toggleApiKeyVisibility(provider.id)
                                    }
                                  >
                                    {showApiKey[provider.id] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {showApiKey[provider.id] ? "Hide" : "Show"}{" "}
                                    API key
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProviderSelect(provider)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  Configure
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit provider configuration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  confirmDeleteProvider(provider.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Remove</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete this provider</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Providers Tab */}
        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available AI Providers</CardTitle>
              <CardDescription>
                Choose from our supported AI providers to add to your
                configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableProviders.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">
                    Loading available providers...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-primary/10 hover:border-primary/30"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shadow-sm">
                            <span className="text-2xl">{provider.logo}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {provider.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {provider.description}
                            </p>
                          </div>
                        </div>

                        {provider.supported_features &&
                          provider.supported_features.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium mb-2">
                                Supported Features:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {provider.supported_features.map(
                                  (feature: string) => (
                                    <Badge
                                      key={feature}
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5"
                                    >
                                      {feature.replace("_", " ")}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 mt-2 hover:bg-primary/10"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              provider_type: provider.id,
                            }));
                            handleNewProvider();
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Provider
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? "Edit Provider" : "New Provider"} Configuration
              </CardTitle>
              <CardDescription>
                Set up your{" "}
                {
                  availableProviders.find(
                    (p) => p.id === formData.provider_type,
                  )?.name
                }{" "}
                integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-type">Provider Type</Label>
                      <Select
                        value={formData.provider_type}
                        onValueChange={handleProviderTypeChange}
                      >
                        <SelectTrigger
                          id="provider-type"
                          className="flex items-center gap-2"
                        >
                          <SelectValue placeholder="Select provider type" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center gap-2">
                                <span>{provider.logo}</span>
                                <span>{provider.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type="password"
                          placeholder={`Enter your ${formData.provider_type} API key`}
                          value={formData.api_key}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              api_key: e.target.value,
                            }))
                          }
                          className="font-mono"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleTestConnection}
                                disabled={
                                  !formData.api_key || testStatus === "loading"
                                }
                              >
                                {testStatus === "loading" ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Test connection</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {testStatus === "success" && (
                        <Alert
                          variant="default"
                          className="bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>{testMessage}</AlertDescription>
                        </Alert>
                      )}
                      {testStatus === "error" && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{testMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="model">Model</Label>
                        {modelsLoading && (
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Loading models...
                          </span>
                        )}
                      </div>
                      <Select
                        value={formData.model}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, model: value }))
                        }
                        disabled={modelsLoading}
                      >
                        <SelectTrigger id="model">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableModels(formData.provider_type)?.length >
                            0 ? (
                            getAvailableModels(formData.provider_type).map(
                              (modelOption) => (
                                <SelectItem
                                  key={modelOption}
                                  value={modelOption}
                                >
                                  {modelOption}
                                </SelectItem>
                              ),
                            )
                          ) : (
                            <SelectItem value="loading" disabled>
                              {modelsLoading
                                ? "Loading models..."
                                : "No models available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {formData.api_key &&
                        !modelsLoading &&
                        getAvailableModels(formData.provider_type).length ===
                        0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-xs text-muted-foreground">
                              No models available. Try testing the connection to
                              fetch available models.
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="temperature">
                          Temperature: {formData.temperature.toFixed(1)}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.temperature < 0.3
                            ? "More deterministic"
                            : formData.temperature > 0.7
                              ? "More creative"
                              : "Balanced"}
                        </span>
                      </div>
                      <Slider
                        id="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[formData.temperature]}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperature: value[0],
                          }))
                        }
                        className="py-4"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness: Lower values are more
                        deterministic, higher values more creative
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-tokens">Max Tokens</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        value={formData.max_tokens}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            max_tokens: parseInt(e.target.value),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of tokens to generate in the response
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="system-prompt">System Prompt</Label>
                      <Textarea
                        id="system-prompt"
                        placeholder="Instructions for the AI assistant"
                        value={formData.system_prompt}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            system_prompt: e.target.value,
                          }))
                        }
                        className="min-h-[100px] resize-y"
                      />
                      <p className="text-xs text-muted-foreground">
                        Instructions that define how the AI assistant should
                        behave
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <Label htmlFor="is-active">Active Status</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable or disable this provider
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formData.is_active ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          id="is-active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              is_active: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="stream-response">Stream Response</Label>
                        <p className="text-xs text-muted-foreground">
                          Show responses as they are generated
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formData.stream_response ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                          id="stream-response"
                          checked={formData.stream_response}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              stream_response: checked,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="context-window">Context Window</Label>
                      <Input
                        id="context-window"
                        type="number"
                        value={formData.context_window}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            context_window: parseInt(e.target.value),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of previous messages to include as context
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="top-p">
                          Top P: {formData.top_p.toFixed(2)}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.top_p < 0.5
                            ? "More focused"
                            : formData.top_p > 0.8
                              ? "More diverse"
                              : "Balanced"}
                        </span>
                      </div>
                      <Slider
                        id="top-p"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[formData.top_p]}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            top_p: value[0],
                          }))
                        }
                        className="py-4"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls diversity via nucleus sampling
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        size="sm"
                        onClick={() =>
                          formData.api_key &&
                          fetchModelsForProvider(
                            formData.provider_type,
                            formData.api_key,
                          )
                        }
                        disabled={!formData.api_key || modelsLoading}
                      >
                        {modelsLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh Available Models
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button
                variant="outline"
                onClick={() => {
                  const providerConfig = availableProviders.find(
                    (p) => p.id === formData.provider_type,
                  );
                  if (providerConfig) {
                    setFormData((prev) => ({
                      ...prev,
                      model: providerConfig.default_model,
                      temperature:
                        providerConfig.default_settings?.temperature || 0.7,
                      max_tokens:
                        providerConfig.default_settings?.max_tokens || 2048,
                      system_prompt:
                        providerConfig.default_settings?.system_prompt ||
                        "You are a helpful assistant.",
                      stream_response:
                        providerConfig.default_settings?.stream_response ??
                        true,
                      context_window:
                        providerConfig.default_settings?.context_window || 4096,
                      top_p: providerConfig.default_settings?.top_p || 0.95,
                    }));
                  }
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("providers")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={
                    loading || !formData.api_key || !formData.provider_type
                  }
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditing ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isEditing ? "Update Provider" : "Save Provider"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIProviderSetup;
