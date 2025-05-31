import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
import {
  Search,
  Plus,
  Settings,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AvailableProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: "configured" | "not_configured";
  models_count?: number;
  default_model?: string;
  available_models?: string[];
  supported_features?: string[];
}

interface AIModel {
  id: string;
  name: string;
  model_id: string;
  provider_type: string;
  ai_provider_id?: string;
  description?: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  capabilities?: Record<string, any>;
  configuration?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscoveredModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  capabilities?: string[];
  context_length?: number;
  pricing?: {
    input?: number;
    output?: number;
  };
}

const AIModelManagement: React.FC = () => {
  const { toast } = useToast();

  // Tab management
  const [activeTab, setActiveTab] = useState("providers");

  // Provider management state
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AvailableProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  // Model discovery state
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  // Model management state
  const [configuredModels, setConfiguredModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    fetchAvailableProviders();
    fetchConfiguredModels();
  }, []);

  const fetchAvailableProviders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/ai-providers");
      const availableTypes =
        response.data?.data?.available_types ||
        response.data?.available_types ||
        {};

      const providerConfigs = Object.entries(availableTypes).map(
        ([id, config]: [string, any]) => ({
          id,
          name: config.name || id,
          logo: config.logo || "🤖",
          description: config.description || `${config.name || id} AI Provider`,
          status: "not_configured" as const,
          models_count: config.models?.length || 0,
          default_model: config.models?.[0] || "default-model",
          available_models: config.models || [],
          supported_features: config.supported_features || [],
        } as AvailableProvider)
      );

      setAvailableProviders(providerConfigs);
    } catch (error) {
      console.error("Failed to fetch available providers:", error);
      setAvailableProviders([]);
      toast({
        title: "Error",
        description: "Failed to load available providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfiguredModels = async () => {
    try {
      const response = await apiClient.get("/ai-models", {
        params: { per_page: 50 }
      });
      const modelsData = response.data?.success
        ? response.data.data
        : response.data?.data || response.data || [];
      setConfiguredModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (error) {
      console.error("Failed to fetch configured models:", error);
      setConfiguredModels([]);
    }
  };

  // Add key format validation helper function
  const validateApiKeyFormat = (provider: string, key: string): { valid: boolean, message?: string } => {
    if (!key || key.trim() === '') {
      return { valid: false, message: "API key is required" };
    }

    // Remove any accidental "Bearer " prefix that might have been copied from elsewhere
    const cleanKey = key.trim().replace(/^Bearer\s+/i, '');

    switch (provider) {
      case 'openai':
        // OpenAI keys generally start with "sk-"
        if (!cleanKey.startsWith('sk-')) {
          return {
            valid: false,
            message: "OpenAI API keys typically start with 'sk-'"
          };
        }
        break;
      case 'claude':
        // Claude keys might start with "sk-ant-" or other formats
        if (!cleanKey.match(/^(sk-ant-|sk-|key-)/i)) {
          return {
            valid: false,
            message: "Anthropic API keys typically start with 'sk-ant-'"
          };
        }
        break;
      case 'groq':
        // Groq keys start with "gsk_"
        if (!cleanKey.startsWith('gsk_')) {
          return {
            valid: false,
            message: "Groq API keys should start with 'gsk_'"
          };
        }
        break;
    }

    return { valid: true };
  };

  const handleTestConnection = async () => {
    if (!selectedProvider || !apiKey) {
      setConnectionStatus("error");
      setConnectionMessage("Please select a provider and enter an API key");
      return;
    }

    // Validate API key format
    const keyValidation = validateApiKeyFormat(selectedProvider.id, apiKey);
    if (!keyValidation.valid) {
      setConnectionStatus("error");
      setConnectionMessage(keyValidation.message || "Invalid API key format");
      return;
    }

    setConnectionStatus("testing");
    setConnectionMessage("Testing connection...");

    try {
      // Clean the API key - remove Bearer prefix if accidentally included
      const cleanedApiKey = apiKey.trim().replace(/^Bearer\s+/i, '');

      const response = await apiClient.post("/ai-providers/test-connection", {
        provider_type: selectedProvider.id,
        api_key: cleanedApiKey,
        model: selectedProvider.default_model,
      });

      if (response.data?.success) {
        setConnectionStatus("success");
        setConnectionMessage("Connection successful! You can now discover models.");

        // Fetch available models for this provider
        await fetchModelsForProvider(selectedProvider.id, cleanedApiKey);

        toast({
          title: "Connection successful",
          description: "Successfully connected to the AI provider.",
        });
      } else {
        setConnectionStatus("error");
        setConnectionMessage(response.data?.message || "Connection failed");

        // Log the error details for debugging
        console.error("Connection failed details:", response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Connection failed. Please check your API key.";
      setConnectionStatus("error");
      setConnectionMessage(errorMessage);
      console.error("Test connection error:", error);
    }
  };

  const fetchModelsForProvider = async (providerType: string, apiKey: string) => {
    try {
      setModelsLoading(true);
      // Clean the API key - remove Bearer prefix if accidentally included
      const cleanedApiKey = apiKey.trim().replace(/^Bearer\s+/i, '');

      const response = await apiClient.post("/ai-models/fetch-available", {
        provider: providerType,
        api_key: cleanedApiKey,
      });

      if (response.data?.success && response.data.models) {
        const models = response.data.models.map((model: any) => ({
          id: typeof model === "string" ? model : model.id || model.name,
          name: typeof model === "string" ? model : model.name || model.id,
          provider: selectedProvider?.name || providerType,
          description: typeof model === "object" ? model.description : undefined,
          capabilities: typeof model === "object" ? model.capabilities : undefined,
          context_length: typeof model === "object" ? model.context_length : undefined,
          pricing: typeof model === "object" ? model.pricing : undefined,
        }));

        setDiscoveredModels(models);

        // Auto-advance to model discovery tab
        if (models.length > 0) {
          setActiveTab("discovery");
        }
      }
    } catch (error) {
      console.error("Failed to fetch models for provider:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      });
    } finally {
      setModelsLoading(false);
    }
  };

  const handleAddModel = async (modelId: string) => {
    if (!selectedProvider || !apiKey) {
      toast({
        title: "Error",
        description: "Please select a provider and test connection first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Clean the API key - remove Bearer prefix if accidentally included
      const cleanedApiKey = apiKey.trim().replace(/^Bearer\s+/i, '');

      const modelData = {
        name: `${selectedProvider.name} - ${modelId}`,
        model_id: modelId,
        provider_type: selectedProvider.id,
        api_key: cleanedApiKey, // Add the API key to the model data
        description: `${modelId} model from ${selectedProvider.name}`,
        temperature: 0.7,
        max_tokens: 2048,
        system_prompt: "You are a helpful assistant.",
        is_active: true,
        is_featured: false,
      };

      const response = await apiClient.post("/ai-models", modelData);

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Model added successfully",
        });

        // Refresh configured models
        await fetchConfiguredModels();

        // Switch to management tab
        setActiveTab("management");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add model",
        variant: "destructive",
      });
    }
  };

  const handleToggleModelActive = async (modelId: string) => {
    try {
      const response = await apiClient.patch(`/ai-models/${modelId}/toggle-active`);

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Model status updated successfully",
        });

        // Refresh configured models
        await fetchConfiguredModels();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update model status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const response = await apiClient.delete(`/ai-models/${modelId}`);

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Model deleted successfully",
        });

        // Refresh configured models
        await fetchConfiguredModels();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Model Management
          </h1>
          <p className="text-muted-foreground">
            Select providers, discover models, and manage your AI configurations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Provider Selection
          </TabsTrigger>
          <TabsTrigger value="discovery" className="gap-2">
            <Search className="h-4 w-4" />
            Model Discovery
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <Settings className="h-4 w-4" />
            Model Management
          </TabsTrigger>
        </TabsList>

        {/* Provider Selection Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select AI Provider</CardTitle>
              <CardDescription>
                Choose an AI provider and configure your API key to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading providers...</span>
                </div>
              ) : (
                <>
                  {/* API Key Configuration Section - Moved to Top */}
                  {selectedProvider && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-xl">{selectedProvider.logo}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Configure {selectedProvider.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Enter your API key to connect and discover models
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="api-key" className="text-base font-medium">
                            API Key for {selectedProvider.name}
                          </Label>
                          <div className="flex gap-2 mt-2">
                            <div className="flex-1">
                              <Input
                                id="api-key"
                                type={showApiKey ? "text" : "password"}
                                placeholder={`Enter your ${selectedProvider.name} API key`}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="font-mono text-base h-12"
                              />
                              {selectedProvider && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedProvider.id === 'openai' && "OpenAI API keys start with 'sk-'"}
                                  {selectedProvider.id === 'claude' && "Anthropic API keys typically start with 'sk-ant-'"}
                                  {selectedProvider.id === 'groq' && "Groq API keys start with 'gsk_'"}
                                </p>
                              )}
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                  >
                                    {showApiKey ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{showApiKey ? "Hide" : "Show"} API key</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              onClick={handleTestConnection}
                              disabled={!apiKey || connectionStatus === "testing"}
                              className="gap-2 h-12 px-6"
                              size="lg"
                            >
                              {connectionStatus === "testing" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Zap className="h-4 w-4" />
                              )}
                              Test Connection
                            </Button>
                          </div>
                        </div>

                        {connectionStatus !== "idle" && (
                          <Alert
                            variant={
                              connectionStatus === "success"
                                ? "default"
                                : connectionStatus === "error"
                                  ? "destructive"
                                  : "default"
                            }
                            className={
                              connectionStatus === "success"
                                ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900"
                                : ""
                            }
                          >
                            {connectionStatus === "success" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : connectionStatus === "error" ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            )}
                            <AlertDescription className="text-base">{connectionMessage}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Provider Selection Grid */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {selectedProvider ? "Change Provider" : "Available Providers"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableProviders.map((provider) => (
                        <Card
                          key={provider.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedProvider?.id === provider.id
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : "border-muted hover:border-primary/30"
                            }`}
                          onClick={() => setSelectedProvider(provider)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <span className="text-2xl">{provider.logo}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{provider.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {provider.models_count} models available
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              {provider.description}
                            </p>
                            {provider.supported_features && provider.supported_features.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {provider.supported_features.slice(0, 3).map((feature) => (
                                  <Badge key={feature} variant="outline" className="text-xs">
                                    {feature.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {selectedProvider?.id === provider.id && (
                              <div className="mt-3 pt-3 border-t">
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Selected
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discover Models</CardTitle>
              <CardDescription>
                Browse and explore available models from {selectedProvider?.name || "your selected provider"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedProvider || connectionStatus !== "success" ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Provider Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Please select a provider and test your connection first
                  </p>
                  <Button onClick={() => setActiveTab("providers")} variant="outline">
                    Go to Provider Selection
                  </Button>
                </div>
              ) : modelsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Discovering models...</span>
                </div>
              ) : discoveredModels.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Models Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No models were discovered for this provider
                  </p>
                  <Button
                    onClick={() => fetchModelsForProvider(selectedProvider.id, apiKey)}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Discovery
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <Button
                      onClick={() => fetchModelsForProvider(selectedProvider.id, apiKey)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {discoveredModels
                      .filter((model) =>
                        !modelSearchQuery ||
                        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                        model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
                      )
                      .map((model) => (
                        <Card key={model.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{model.name}</h3>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {model.id}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {model.provider}
                              </Badge>
                            </div>

                            {model.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {model.description}
                              </p>
                            )}

                            {model.capabilities && model.capabilities.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-medium mb-2">Capabilities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {model.capabilities.slice(0, 3).map((capability) => (
                                    <Badge key={capability} variant="secondary" className="text-xs">
                                      {capability}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {model.context_length && (
                              <p className="text-xs text-muted-foreground mb-4">
                                Context: {model.context_length.toLocaleString()} tokens
                              </p>
                            )}

                            <Button
                              onClick={() => handleAddModel(model.id)}
                              className="w-full gap-2"
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                              Add Model
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Management</CardTitle>
              <CardDescription>
                Manage your configured AI models and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configuredModels.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Models Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add models from the discovery tab to get started
                  </p>
                  <Button onClick={() => setActiveTab("discovery")} variant="outline">
                    Discover Models
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {configuredModels.map((model) => (
                    <Card key={model.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{model.name}</h3>
                              <Badge
                                variant={model.is_active ? "default" : "secondary"}
                                className="gap-1"
                              >
                                {model.is_active ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                {model.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {model.is_featured && (
                                <Badge variant="outline" className="gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono mb-2">
                              {model.model_id}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Provider: {model.provider_type} • Temperature: {model.temperature} • Max Tokens: {model.max_tokens}
                            </p>
                            {model.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {model.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleModelActive(model.id)}
                                    className="gap-2"
                                  >
                                    {model.is_active ? (
                                      <ToggleLeft className="h-4 w-4" />
                                    ) : (
                                      <ToggleRight className="h-4 w-4" />
                                    )}
                                    {model.is_active ? "Disable" : "Enable"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{model.is_active ? "Disable" : "Enable"} this model</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteModel(model.id)}
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete this model</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelManagement;
