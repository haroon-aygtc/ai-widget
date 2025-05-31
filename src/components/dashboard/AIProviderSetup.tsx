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
} from "lucide-react";

interface AIProviderSetupProps {
  onSave?: (config: AIProviderConfig) => void;
}

interface AIProviderConfig {
  provider_type: string;
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
  onSave = () => {},
}) => {
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
      const { aiProviderApi } = await import("@/lib/api");
      const response = await aiProviderApi.getAll();

      const providersData = response.data?.data || response.data || [];
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProviders = async () => {
    try {
      const { aiProviderApi } = await import("@/lib/api");
      const response = await aiProviderApi.getAvailableProviders();

      if (response.data?.success && response.data?.providers) {
        const providerConfigs = Object.entries(response.data.providers).map(
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
      }
    } catch (error) {
      console.error("Failed to fetch available providers:", error);
      setAvailableProviders([]);
    }
  };

  const fetchModelsForProvider = async (
    providerType: string,
    apiKey: string,
  ) => {
    if (!apiKey) return;

    try {
      setModelsLoading(true);
      const { aiModelApi } = await import("@/lib/models-api");

      const response = await aiModelApi.fetchAvailableModels({
        provider: providerType,
        api_key: apiKey,
      });

      if (response.data?.success && response.data?.models) {
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
      // Import the API service
      const { aiProviderApi } = await import("@/lib/api");

      // Call the test connection endpoint
      const response = await aiProviderApi.testConnection({
        provider: formData.provider_type,
        apiKey: formData.api_key,
      });

      if (response.data.success) {
        setTestStatus("success");
        setTestMessage(response.data.message || "Connection successful!");

        // Fetch available models after successful connection
        await fetchModelsForProvider(formData.provider_type, formData.api_key);
      } else {
        setTestStatus("error");
        setTestMessage(
          response.data.message || "Invalid API key or connection failed",
        );
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage("Connection failed. Please try again.");
      console.error("Test connection error:", error);
    }
  };

  const handleSaveConfiguration = async () => {
    const config: AIProviderConfig = {
      provider_type: formData.provider_type,
      api_key: formData.api_key,
      model: formData.model,
      temperature: formData.temperature,
      max_tokens: formData.max_tokens,
      system_prompt: formData.system_prompt,
      stream_response: formData.stream_response,
      context_window: formData.context_window,
      top_p: formData.top_p,
      is_active: formData.is_active,
    };

    try {
      setLoading(true);
      const { aiProviderApi } = await import("@/lib/api");

      if (isEditing && selectedProvider) {
        // Update existing provider
        await aiProviderApi.update(selectedProvider.id, config);
        alert("AI Provider configuration updated successfully!");
      } else {
        // Create new provider
        await aiProviderApi.create(config);
        alert("AI Provider configuration saved successfully!");
      }

      // Refresh providers list
      await fetchProviders();

      // Call the onSave callback
      onSave(config);

      // Reset form and go back to providers tab
      setActiveTab("providers");
    } catch (error) {
      console.error("Save configuration error:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    try {
      setLoading(true);
      const { aiProviderApi } = await import("@/lib/api");
      await aiProviderApi.delete(providerId);

      // Refresh providers list
      await fetchProviders();
      alert("Provider deleted successfully!");
    } catch (error) {
      console.error("Delete provider error:", error);
      alert("Failed to delete provider. Please try again.");
    } finally {
      setLoading(false);
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
              {providers.length === 0 ? (
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-lg">
                            {availableProviders.find(
                              (p) => p.id === provider.provider_type,
                            )?.logo || "🤖"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold capitalize">
                              {provider.provider_type}
                            </h3>
                            <Badge
                              variant={
                                provider.is_active ? "default" : "secondary"
                              }
                            >
                              {provider.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Model: {provider.model} •{" "}
                            {provider.last_used
                              ? `Last used: ${new Date(provider.last_used).toLocaleDateString()}`
                              : "Never used"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              API Key:
                            </span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {showApiKey[provider.id]
                                ? provider.api_key
                                : provider.api_key.replace(/./g, "*")}
                            </code>
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProviderSelect(provider)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProviders.map((provider) => (
                  <Card
                    key={provider.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{provider.logo}</span>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {provider.description}
                          </p>
                          {provider.supported_features && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.supported_features
                                .slice(0, 2)
                                .map((feature: string) => (
                                  <Badge
                                    key={feature}
                                    variant="outline"
                                    className="text-xs px-1 py-0"
                                  >
                                    {feature.replace("_", " ")}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
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
                        <SelectTrigger id="provider-type">
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
                        />
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
                      </div>
                      {testStatus === "success" && (
                        <Alert
                          variant="default"
                          className="bg-green-50 text-green-800 border-green-200"
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
                      <Label htmlFor="model">
                        Model
                        {modelsLoading && (
                          <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                        )}
                      </Label>
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
                      <Label htmlFor="temperature">
                        Temperature: {formData.temperature}
                      </Label>
                      <Input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperature: parseFloat(e.target.value),
                          }))
                        }
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
                      <textarea
                        id="system-prompt"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Instructions for the AI assistant"
                        value={formData.system_prompt}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            system_prompt: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Instructions that define how the AI assistant should
                        behave
                      </p>
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
                      <Label htmlFor="top-p">Top P: {formData.top_p}</Label>
                      <Input
                        id="top-p"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.top_p}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            top_p: parseFloat(e.target.value),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls diversity via nucleus sampling
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full"
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
                          <Settings className="mr-2 h-4 w-4" />
                        )}
                        Refresh Available Models
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
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
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                disabled={
                  loading || !formData.api_key || !formData.provider_type
                }
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditing ? "Update Configuration" : "Save Configuration"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIProviderSetup;
