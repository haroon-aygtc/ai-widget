import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Star,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Zap,
  Database,
  Settings,
  Eye,
  EyeOff,
  Key,
  ChevronDown,
  Filter,
  Bot,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

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

interface AIProvider {
  id: string;
  provider_type: string;
  name: string;
  api_key: string;
  model?: string;
  is_active: boolean;
  logo?: string;
  description?: string;
  status?: "configured" | "not_configured";
  available_models?: string[];
}

interface AvailableProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: "configured" | "not_configured";
  models_count?: number;
  default_model?: string;
  available_models?: string[];
}

const AIModelManagement: React.FC = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [availableProviders, setAvailableProviders] = useState<
    AvailableProvider[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<
    Record<string, string[]>
  >({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>(
    {},
  );
  const [testingModel, setTestingModel] = useState(false);
  const [testResponse, setTestResponse] = useState<string>("");
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isProviderSheetOpen, setIsProviderSheetOpen] = useState(false);
  const [selectedProviderForConfig, setSelectedProviderForConfig] =
    useState<AvailableProvider | null>(null);
  const [isModelCommandOpen, setIsModelCommandOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  // Form state for provider configuration
  const [providerFormData, setProviderFormData] = useState({
    provider_type: "",
    api_key: "",
    is_active: true,
  });

  // Form state for model configuration
  const [modelFormData, setModelFormData] = useState({
    name: "",
    model_id: "",
    provider_type: "",
    ai_provider_id: "",
    description: "",
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: "",
    is_active: true,
    is_featured: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data on component mount
  useEffect(() => {
    fetchProviders();
    fetchAvailableProviders();
    fetchModels();
  }, [currentPage, searchQuery, selectedProvider, activeFilter]);

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get("/ai-providers");
      const providersData = response.data?.success
        ? response.data.configured_providers || response.data.data || []
        : response.data?.configured_providers ||
          response.data?.data ||
          response.data ||
          [];
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setProviders([]);
    }
  };

  const fetchAvailableProviders = async () => {
    try {
      const response = await apiClient.get("/ai-providers");
      const availableTypes =
        response.data?.data?.available_types ||
        response.data?.available_types ||
        {};

      const providerConfigs = Object.entries(availableTypes).map(
        ([id, config]: [string, any]) => {
          const configuredProvider = providers.find(
            (p) => p.provider_type === id,
          );
          return {
            id,
            name: config.name || id,
            logo: config.logo || "🤖",
            description:
              config.description || `${config.name || id} AI Provider`,
            status: configuredProvider ? "configured" : "not_configured",
            models_count: config.models?.length || 0,
            default_model: config.models?.[0] || "default-model",
            available_models: config.models || [],
          } as AvailableProvider;
        },
      );

      setAvailableProviders(providerConfigs);
    } catch (error) {
      console.error("Failed to fetch available providers:", error);
      setAvailableProviders([]);
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 12,
        search: searchQuery || undefined,
        provider_type: selectedProvider || undefined,
        is_active: activeFilter ? activeFilter === "active" : undefined,
      };

      const response = await apiClient.get("/ai-models", { params });
      const modelsData = response.data?.success
        ? response.data.data
        : response.data?.data || response.data || [];
      setModels(Array.isArray(modelsData) ? modelsData : []);

      const total = response.data?.total || 0;
      const perPage = response.data?.per_page || 12;
      setTotalPages(Math.ceil(total / perPage));
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModels([]);
      toast({
        title: "Error",
        description: "Failed to load AI models",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async (providerType: string, apiKey: string) => {
    if (!providerType || !apiKey) return;

    try {
      setFetchingModels((prev) => ({ ...prev, [providerType]: true }));
      const response = await apiClient.post("/ai-models/fetch-available", {
        provider: providerType,
        api_key: apiKey,
      });

      if (response.data.success && response.data.models) {
        const models = response.data.models.map((model: any) =>
          typeof model === "string" ? model : model.id || model.name,
        );
        setAvailableModels((prev) => ({ ...prev, [providerType]: models }));
      }
    } catch (error) {
      console.error("Failed to fetch available models:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      });
    } finally {
      setFetchingModels((prev) => ({ ...prev, [providerType]: false }));
    }
  };

  const handleProviderConfiguration = async () => {
    if (!providerFormData.api_key || !providerFormData.provider_type) {
      toast({
        title: "Error",
        description: "API key and provider type are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const providerConfig = availableProviders.find(
        (p) => p.id === providerFormData.provider_type,
      );
      const config = {
        provider_type: providerFormData.provider_type,
        name: providerConfig?.name || providerFormData.provider_type,
        api_key: providerFormData.api_key,
        model: providerConfig?.default_model || "default",
        is_active: providerFormData.is_active,
      };

      const existingProvider = providers.find(
        (p) => p.provider_type === providerFormData.provider_type,
      );
      let response;

      if (existingProvider) {
        response = await apiClient.put(
          `/ai-providers/${existingProvider.id}`,
          config,
        );
      } else {
        response = await apiClient.post("/ai-providers", config);
      }

      if (response.data?.success) {
        toast({
          title: "Success",
          description: `Provider ${existingProvider ? "updated" : "configured"} successfully`,
        });

        await fetchProviders();
        await fetchAvailableProviders();
        await fetchAvailableModels(
          providerFormData.provider_type,
          providerFormData.api_key,
        );

        setIsProviderSheetOpen(false);
        resetProviderForm();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to configure provider",
        variant: "destructive",
      });
    }
  };

  const handleCreateModel = async () => {
    if (!validateModelForm()) return;

    try {
      const response = await apiClient.post("/ai-models", modelFormData);
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "AI model created successfully",
        });
        resetModelForm();
        fetchModels();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create AI model",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const response = await apiClient.delete(`/ai-models/${id}`);
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "AI model deleted successfully",
        });
        fetchModels();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete AI model",
        variant: "destructive",
      });
    }
  };

  const handleToggleModelActive = async (id: string) => {
    try {
      const response = await apiClient.put(`/ai-models/${id}/toggle-active`);
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Model status updated successfully",
        });
        fetchModels();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update model status",
        variant: "destructive",
      });
    }
  };

  const validateModelForm = () => {
    const errors: Record<string, string> = {};
    if (!modelFormData.name.trim()) errors.name = "Name is required";
    if (!modelFormData.model_id.trim())
      errors.model_id = "Model ID is required";
    if (!modelFormData.provider_type.trim())
      errors.provider_type = "Provider is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetProviderForm = () => {
    setProviderFormData({
      provider_type: "",
      api_key: "",
      is_active: true,
    });
    setSelectedProviderForConfig(null);
  };

  const resetModelForm = () => {
    setModelFormData({
      name: "",
      model_id: "",
      provider_type: "",
      ai_provider_id: "",
      description: "",
      temperature: 0.7,
      max_tokens: 1000,
      system_prompt: "",
      is_active: true,
      is_featured: false,
    });
    setFormErrors({});
    setSelectedModel(null);
  };

  const openProviderConfiguration = (provider: AvailableProvider) => {
    setSelectedProviderForConfig(provider);
    const existingProvider = providers.find(
      (p) => p.provider_type === provider.id,
    );

    setProviderFormData({
      provider_type: provider.id,
      api_key: existingProvider?.api_key || "",
      is_active: existingProvider?.is_active ?? true,
    });

    setIsProviderSheetOpen(true);
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      !searchQuery ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.model_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider =
      !selectedProvider || model.provider_type === selectedProvider;
    const matchesStatus =
      !activeFilter ||
      (activeFilter === "active" && model.is_active) ||
      (activeFilter === "inactive" && !model.is_active);

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const getAllAvailableModels = () => {
    const allModels: Array<{
      id: string;
      name: string;
      provider: string;
      logo: string;
    }> = [];

    availableProviders.forEach((provider) => {
      const providerModels =
        availableModels[provider.id] || provider.available_models || [];
      providerModels.forEach((modelId) => {
        allModels.push({
          id: modelId,
          name: modelId,
          provider: provider.name,
          logo: provider.logo,
        });
      });
    });

    return allModels.filter(
      (model) =>
        !modelSearchQuery ||
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase()),
    );
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Model Management
          </h1>
          <p className="text-muted-foreground">
            Configure providers and manage your AI models for chat widgets
          </p>
        </div>
        <div className="flex gap-2">
          <Popover
            open={isModelCommandOpen}
            onOpenChange={setIsModelCommandOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Models
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="Search models..."
                  value={modelSearchQuery}
                  onValueChange={setModelSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No models found.</CommandEmpty>
                  <CommandGroup heading="Available Models">
                    {getAllAvailableModels()
                      .slice(0, 10)
                      .map((model) => (
                        <CommandItem
                          key={`${model.provider}-${model.id}`}
                          onSelect={() => {
                            setModelFormData((prev) => ({
                              ...prev,
                              model_id: model.id,
                              name: model.name,
                              provider_type:
                                availableProviders.find(
                                  (p) => p.name === model.provider,
                                )?.id || "",
                            }));
                            setIsModelCommandOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-lg">{model.logo}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {model.provider}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={() => resetModelForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Model
          </Button>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <Database className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="configure" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>
                Connect and manage your AI providers. Click on any provider to
                configure it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProviders.map((provider) => {
                  const configuredProvider = providers.find(
                    (p) => p.provider_type === provider.id,
                  );
                  const isConfigured = provider.status === "configured";

                  return (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isConfigured
                          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                          : "border-gray-200 hover:border-primary/30"
                      }`}
                      onClick={() => openProviderConfiguration(provider)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <span className="text-xl">{provider.logo}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{provider.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {provider.models_count} models available
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isConfigured ? "default" : "secondary"}
                          >
                            {isConfigured ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />{" "}
                                Configured
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" /> Not
                                Configured
                              </>
                            )}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {provider.description}
                        </p>

                        {isConfigured && configuredProvider && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                API Key:
                              </span>
                              <code className="bg-muted px-1 rounded font-mono">
                                {showApiKeys[provider.id]
                                  ? configuredProvider.api_key
                                  : "••••••••••••••••"}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleApiKeyVisibility(provider.id);
                                }}
                              >
                                {showApiKeys[provider.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            {fetchingModels[provider.id] && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Fetching models...
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {isConfigured
                              ? "Click to reconfigure"
                              : "Click to configure"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Models</CardTitle>
              <CardDescription>
                Manage your configured AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Select
                  value={selectedProvider}
                  onValueChange={setSelectedProvider}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Providers</SelectItem>
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

                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery || selectedProvider || activeFilter
                      ? "No models found"
                      : "No models configured"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedProvider || activeFilter
                      ? "Try adjusting your search or filters"
                      : "Create your first AI model to get started"}
                  </p>
                  {!searchQuery && !selectedProvider && !activeFilter && (
                    <Button onClick={() => resetModelForm()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Model
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModels.map((model) => {
                    const provider = availableProviders.find(
                      (p) => p.id === model.provider_type,
                    );

                    return (
                      <Card
                        key={model.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <span className="text-lg">
                                  {provider?.logo || "🤖"}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {model.name}
                                  </h3>
                                  {model.is_featured && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {provider?.name || model.provider_type} •{" "}
                                  {model.model_id}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                model.is_active ? "default" : "secondary"
                              }
                            >
                              {model.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          {model.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {model.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span>Temp: {model.temperature}</span>
                            <span>Max Tokens: {model.max_tokens}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleModelActive(model.id)
                                    }
                                  >
                                    {model.is_active ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {model.is_active
                                      ? "Deactivate"
                                      : "Activate"}{" "}
                                    model
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedModel(model);
                                      setModelFormData({
                                        name: model.name,
                                        model_id: model.model_id,
                                        provider_type: model.provider_type,
                                        ai_provider_id:
                                          model.ai_provider_id || "",
                                        description: model.description || "",
                                        temperature: model.temperature,
                                        max_tokens: model.max_tokens,
                                        system_prompt:
                                          model.system_prompt || "",
                                        is_active: model.is_active,
                                        is_featured: model.is_featured,
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit model</p>
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
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete model</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {selectedModel ? "Edit Model" : "Create New Model"}
              </CardTitle>
              <CardDescription>
                {selectedModel
                  ? `Configure settings for ${selectedModel.name}`
                  : "Set up a new AI model for your chat widgets"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_type">Provider</Label>
                  <Select
                    value={modelFormData.provider_type}
                    onValueChange={(value) => {
                      const provider = providers.find(
                        (p) => p.provider_type === value,
                      );
                      setModelFormData((prev) => ({
                        ...prev,
                        provider_type: value,
                        ai_provider_id: provider?.id || "",
                      }));
                    }}
                  >
                    <SelectTrigger
                      className={
                        formErrors.provider_type ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers
                        .filter((p) => p.is_active)
                        .map((provider) => {
                          const providerConfig = availableProviders.find(
                            (ap) => ap.id === provider.provider_type,
                          );
                          return (
                            <SelectItem
                              key={provider.id}
                              value={provider.provider_type}
                            >
                              <div className="flex items-center gap-2">
                                <span>{providerConfig?.logo || "🤖"}</span>
                                <span>
                                  {providerConfig?.name ||
                                    provider.provider_type}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  {formErrors.provider_type && (
                    <p className="text-sm text-red-500">
                      {formErrors.provider_type}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model_id">Model</Label>
                  <Select
                    value={modelFormData.model_id}
                    onValueChange={(value) => {
                      setModelFormData((prev) => ({
                        ...prev,
                        model_id: value,
                      }));
                      if (!modelFormData.name) {
                        setModelFormData((prev) => ({ ...prev, name: value }));
                      }
                    }}
                    disabled={!modelFormData.provider_type}
                  >
                    <SelectTrigger
                      className={formErrors.model_id ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableModels[modelFormData.provider_type] || []).map(
                        (model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.model_id && (
                    <p className="text-sm text-red-500">
                      {formErrors.model_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={modelFormData.name}
                  onChange={(e) =>
                    setModelFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className={formErrors.name ? "border-red-500" : ""}
                  placeholder="Enter a display name for this model"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={modelFormData.description}
                  onChange={(e) =>
                    setModelFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optional description of this model's capabilities and use cases"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="temperature">
                      Temperature: {modelFormData.temperature}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {modelFormData.temperature < 0.3
                        ? "More deterministic"
                        : modelFormData.temperature > 1.2
                          ? "More creative"
                          : "Balanced"}
                    </span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[modelFormData.temperature]}
                    onValueChange={(value) =>
                      setModelFormData((prev) => ({
                        ...prev,
                        temperature: value[0],
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">
                    Max Tokens: {modelFormData.max_tokens}
                  </Label>
                  <Slider
                    id="max_tokens"
                    min={100}
                    max={8000}
                    step={100}
                    value={[modelFormData.max_tokens]}
                    onValueChange={(value) =>
                      setModelFormData((prev) => ({
                        ...prev,
                        max_tokens: value[0],
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={modelFormData.system_prompt}
                  onChange={(e) =>
                    setModelFormData((prev) => ({
                      ...prev,
                      system_prompt: e.target.value,
                    }))
                  }
                  placeholder="Instructions that define how the AI should behave"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={modelFormData.is_active}
                      onCheckedChange={(checked) =>
                        setModelFormData((prev) => ({
                          ...prev,
                          is_active: checked,
                        }))
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={modelFormData.is_featured}
                      onCheckedChange={(checked) =>
                        setModelFormData((prev) => ({
                          ...prev,
                          is_featured: checked,
                        }))
                      }
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetModelForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateModel}>
                    {selectedModel ? "Update Model" : "Create Model"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Provider Configuration Sheet */}
      <Sheet open={isProviderSheetOpen} onOpenChange={setIsProviderSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedProviderForConfig && (
                <span className="text-xl">
                  {selectedProviderForConfig.logo}
                </span>
              )}
              Configure {selectedProviderForConfig?.name}
            </SheetTitle>
            <SheetDescription>
              {selectedProviderForConfig?.status === "configured"
                ? "Update your provider configuration"
                : "Set up your API key to start using this provider"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type="password"
                  placeholder={`Enter your ${selectedProviderForConfig?.name} API key`}
                  value={providerFormData.api_key}
                  onChange={(e) =>
                    setProviderFormData((prev) => ({
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
                        onClick={() => {
                          if (
                            providerFormData.api_key &&
                            selectedProviderForConfig
                          ) {
                            fetchAvailableModels(
                              selectedProviderForConfig.id,
                              providerFormData.api_key,
                            );
                          }
                        }}
                        disabled={
                          !providerFormData.api_key ||
                          fetchingModels[selectedProviderForConfig?.id || ""]
                        }
                      >
                        {fetchingModels[selectedProviderForConfig?.id || ""] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Test connection & fetch models</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is encrypted and stored securely
              </p>
            </div>

            {selectedProviderForConfig &&
              availableModels[selectedProviderForConfig.id] && (
                <div className="space-y-2">
                  <Label>Available Models</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                    <div className="flex flex-wrap gap-1">
                      {availableModels[selectedProviderForConfig.id]
                        .slice(0, 10)
                        .map((model) => (
                          <Badge
                            key={model}
                            variant="outline"
                            className="text-xs"
                          >
                            {model}
                          </Badge>
                        ))}
                      {availableModels[selectedProviderForConfig.id].length >
                        10 && (
                        <Badge variant="outline" className="text-xs">
                          +
                          {availableModels[selectedProviderForConfig.id]
                            .length - 10}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

            <div className="flex items-center space-x-2">
              <Switch
                id="provider_active"
                checked={providerFormData.is_active}
                onCheckedChange={(checked) =>
                  setProviderFormData((prev) => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
              <Label htmlFor="provider_active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsProviderSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProviderConfiguration}
                disabled={!providerFormData.api_key}
              >
                {selectedProviderForConfig?.status === "configured"
                  ? "Update"
                  : "Configure"}{" "}
                Provider
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AIModelManagement;
