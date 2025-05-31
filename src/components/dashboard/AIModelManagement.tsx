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
  CardFooter,
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
  api_key: string;
  model?: string;
  is_active: boolean;
}

interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

type ViewMode = "list" | "create" | "edit" | "test";

const AIModelManagement: React.FC = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("models");
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingModel, setTestingModel] = useState(false);
  const [testResponse, setTestResponse] = useState<string>("");
  const [testMetrics, setTestMetrics] = useState<Record<string, any> | null>(
    null,
  );
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
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

  // Load models and providers
  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, [currentPage, searchQuery, providerFilter, activeFilter]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 10,
        search: searchQuery || undefined,
        provider_type: providerFilter || undefined,
        is_active: activeFilter ? activeFilter === "active" : undefined,
      };

      const response = await apiClient.get('/ai-models', { params });
      console.log("Models API response:", response.data);

      // Handle the new API response format
      const modelsData = response.data?.success
        ? response.data.data
        : response.data?.data || response.data || [];
      setModels(Array.isArray(modelsData) ? modelsData : []);

      const total = response.data?.total || 0;
      const perPage = response.data?.per_page || 10;
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

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get('/ai-providers');
      console.log("Providers API response:", response.data);

      // Handle the new API response format
      const providersData = response.data?.success
        ? response.data.data
        : response.data?.data || response.data || [];
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setProviders([]);
      toast({
        title: "Error",
        description: "Failed to load AI providers",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableModels = async (providerType: string, apiKey: string) => {
    if (!providerType || !apiKey) {
      setAvailableModels([]);
      return;
    }

    try {
      setFetchingModels(true);
      const response = await apiClient.post('/ai-models/fetch-available', {
        provider: providerType,
        api_key: apiKey,
      });

      if (response.data.success && response.data.models) {
        setAvailableModels(response.data.models);
      } else {
        setAvailableModels([]);
        toast({
          title: "Warning",
          description:
            response.data.message || "No models found for this provider",
          variant: "default",
        });
      }
    } catch (error) {
      setAvailableModels([]);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (value: string) => {
    setFormData({
      ...formData,
      provider_type: value,
      model_id: "",
      ai_provider_id: "",
    });

    const selectedProvider = (providers || []).find(
      (p) => p.provider_type === value,
    );
    if (selectedProvider) {
      setFormData((prev) => ({
        ...prev,
        provider_type: value,
        model_id: "",
        ai_provider_id: selectedProvider.id,
      }));

      fetchAvailableModels(value, selectedProvider.api_key);
    } else {
      setAvailableModels([]);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const selectedModelOption = (availableModels || []).find(
      (m) => m.id === modelId,
    );
    if (selectedModelOption) {
      setFormData((prev) => ({
        ...prev,
        model_id: modelId,
        name: selectedModelOption.name || modelId,
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.model_id.trim()) errors.model_id = "Model ID is required";
    if (!formData.provider_type.trim())
      errors.provider_type = "Provider is required";
    if (formData.temperature < 0 || formData.temperature > 2) {
      errors.temperature = "Temperature must be between 0 and 2";
    }
    if (formData.max_tokens < 1 || formData.max_tokens > 32000) {
      errors.max_tokens = "Max tokens must be between 1 and 32000";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateModel = async () => {
    if (!validateForm()) return;

    try {
      const response = await apiClient.post('/ai-models', formData);
      const message = response.data?.message || "AI model created successfully";
      toast({
        title: "Success",
        description: message,
      });
      resetForm();
      fetchModels();
      setActiveTab("models");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create AI model";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages)
              ? messages[0]
              : messages;
          },
        );
        setFormErrors(backendErrors);
      }
    }
  };

  const handleUpdateModel = async () => {
    if (!selectedModel || !validateForm()) return;

    try {
      const response = await apiClient.put(`/ai-models/${selectedModel.id}`, formData);
      const message = response.data?.message || "AI model updated successfully";
      toast({
        title: "Success",
        description: message,
      });
      resetForm();
      fetchModels();
      setActiveTab("models");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update AI model";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages)
              ? messages[0]
              : messages;
          },
        );
        setFormErrors(backendErrors);
      }
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const response = await apiClient.delete(`/ai-models/${id}`);
      const message = response.data?.message || "AI model deleted successfully";
      toast({
        title: "Success",
        description: message,
      });
      fetchModels();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete AI model";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await apiClient.put(`/ai-models/${id}/toggle-active`);
      const message =
        response.data?.message ||
        `Model ${response.data?.data?.is_active ? "activated" : "deactivated"} successfully`;
      toast({
        title: "Success",
        description: message,
      });
      fetchModels();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update model status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const response = await apiClient.put(`/ai-models/${id}/toggle-featured`);
      const message =
        response.data?.message ||
        `Model ${response.data?.data?.is_featured ? "featured" : "unfeatured"} successfully`;
      toast({
        title: "Success",
        description: message,
      });
      fetchModels();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update featured status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTestModel = async () => {
    if (!formData.provider_type || !formData.model_id) {
      toast({
        title: "Error",
        description: "Provider and model must be selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestingModel(true);
      setTestResponse("");
      setTestMetrics(null);

      const selectedProvider = (providers || []).find(
        (p) => p.provider_type === formData.provider_type,
      );
      if (!selectedProvider) {
        throw new Error("Provider not found");
      }

      const response = await apiClient.post('/ai-models/test', {
        provider: formData.provider_type,
        model_id: formData.model_id,
        api_key: selectedProvider.api_key,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        system_prompt: formData.system_prompt,
      });

      if (response.data.success) {
        setTestResponse(
          response.data.response || "Test successful, but no response content",
        );
        setTestMetrics(response.data.metrics || null);
        toast({
          title: "Success",
          description: "Model test completed successfully",
        });
      } else {
        setTestResponse(
          "Test failed: " + (response.data.message || "Unknown error"),
        );
        toast({
          title: "Warning",
          description: response.data.message || "Test failed",
          variant: "default",
        });
      }
    } catch (error: any) {
      setTestResponse("Error: " + (error.message || "Unknown error"));
      toast({
        title: "Error",
        description: "Failed to test model",
        variant: "destructive",
      });
    } finally {
      setTestingModel(false);
    }
  };

  const openEditModel = (model: AIModel) => {
    setSelectedModel(model);
    setFormData({
      name: model.name,
      model_id: model.model_id,
      provider_type: model.provider_type,
      ai_provider_id: model.ai_provider_id || "",
      description: model.description || "",
      temperature: model.temperature,
      max_tokens: model.max_tokens,
      system_prompt: model.system_prompt || "",
      is_active: model.is_active,
      is_featured: model.is_featured,
    });

    const selectedProvider = (providers || []).find(
      (p) => p.provider_type === model.provider_type,
    );
    if (selectedProvider) {
      fetchAvailableModels(model.provider_type, selectedProvider.api_key);
    }

    setActiveTab("configure");
  };

  const openTestModel = (model: AIModel) => {
    setSelectedModel(model);
    setFormData({
      name: model.name,
      model_id: model.model_id,
      provider_type: model.provider_type,
      ai_provider_id: model.ai_provider_id || "",
      description: model.description || "",
      temperature: model.temperature,
      max_tokens: model.max_tokens,
      system_prompt: model.system_prompt || "",
      is_active: model.is_active,
      is_featured: model.is_featured,
    });

    setTestResponse("");
    setTestMetrics(null);
    setActiveTab("test");
  };

  const resetForm = () => {
    setFormData({
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
    setAvailableModels([]);
  };

  const openCreateModel = () => {
    resetForm();
    setActiveTab("configure");
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Model Management
          </h1>
          <p className="text-muted-foreground">
            Configure and manage your AI models for chat widgets
          </p>
        </div>
        <Button onClick={openCreateModel} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Model
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models" className="gap-2">
            <Database className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="configure" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Zap className="h-4 w-4" />
            Test
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Providers
          </TabsTrigger>
        </TabsList>

        {/* Models List Tab */}
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

                <div className="w-full md:w-[200px]">
                  <Select
                    value={providerFilter}
                    onValueChange={setProviderFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {(providers || []).map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.provider_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-[200px]">
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (models || []).length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No models found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AI model to get started
                  </p>
                  <Button onClick={openCreateModel} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Model
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(models || []).map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{model.name}</h3>
                            {model.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <Badge
                              variant={
                                model.is_active ? "default" : "secondary"
                              }
                            >
                              {model.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {model.provider_type} • {model.model_id}
                          </p>
                          {model.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {model.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTestModel(model)}
                          className="gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModel(model)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ),
                    )}
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

        {/* Configure Model Tab */}
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
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                  <TabsTrigger value="system">System Prompt</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider_type">Provider</Label>
                      <Select
                        value={formData.provider_type}
                        onValueChange={handleProviderChange}
                      >
                        <SelectTrigger
                          id="provider_type"
                          className={
                            formErrors.provider_type ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {(providers || []).map((provider) => (
                            <SelectItem
                              key={provider.id}
                              value={provider.provider_type}
                            >
                              {provider.provider_type}
                            </SelectItem>
                          ))}
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
                      <div className="relative">
                        <Select
                          value={formData.model_id}
                          onValueChange={handleModelSelect}
                          disabled={!formData.provider_type || fetchingModels}
                        >
                          <SelectTrigger
                            id="model_id"
                            className={
                              formErrors.model_id ? "border-red-500" : ""
                            }
                          >
                            <SelectValue
                              placeholder={
                                fetchingModels
                                  ? "Loading models..."
                                  : "Select Model"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableModels || []).map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name || model.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fetchingModels && (
                          <div className="absolute right-8 top-2.5">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        )}
                      </div>
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
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description of this model's capabilities and use cases"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="temperature">
                        Temperature: {formData.temperature}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {formData.temperature < 0.3
                          ? "More deterministic"
                          : formData.temperature > 1.2
                            ? "More creative"
                            : "Balanced"}
                      </span>
                    </div>
                    <Slider
                      id="temperature"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[formData.temperature]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, temperature: value[0] })
                      }
                      className={formErrors.temperature ? "border-red-500" : ""}
                    />
                    {formErrors.temperature && (
                      <p className="text-sm text-red-500">
                        {formErrors.temperature}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_tokens">
                      Max Tokens: {formData.max_tokens}
                    </Label>
                    <Slider
                      id="max_tokens"
                      min={100}
                      max={8000}
                      step={100}
                      value={[formData.max_tokens]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, max_tokens: value[0] })
                      }
                      className={formErrors.max_tokens ? "border-red-500" : ""}
                    />
                    {formErrors.max_tokens && (
                      <p className="text-sm text-red-500">
                        {formErrors.max_tokens}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="system" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_prompt">System Prompt</Label>
                    <Textarea
                      id="system_prompt"
                      value={formData.system_prompt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          system_prompt: e.target.value,
                        })
                      }
                      placeholder="Instructions that define how the AI should behave"
                      className="min-h-[200px]"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("models")}>
                Cancel
              </Button>
              <Button
                onClick={selectedModel ? handleUpdateModel : handleCreateModel}
              >
                {selectedModel ? "Update Model" : "Create Model"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Test Model Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test AI Model
              </CardTitle>
              <CardDescription>
                Test the model with a sample prompt to verify it works correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Model Information</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {formData.name}
                      </p>
                      <p>
                        <span className="font-medium">Provider:</span>{" "}
                        {formData.provider_type}
                      </p>
                      <p>
                        <span className="font-medium">Model ID:</span>{" "}
                        {formData.model_id}
                      </p>
                      <p>
                        <span className="font-medium">Temperature:</span>{" "}
                        {formData.temperature}
                      </p>
                      <p>
                        <span className="font-medium">Max Tokens:</span>{" "}
                        {formData.max_tokens}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Test Settings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="test_temperature">
                          Temperature: {formData.temperature}
                        </Label>
                      </div>
                      <Slider
                        id="test_temperature"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[formData.temperature]}
                        onValueChange={(value) =>
                          setFormData({ ...formData, temperature: value[0] })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Test Response</h3>
                    <Button
                      onClick={handleTestModel}
                      disabled={testingModel}
                      size="sm"
                    >
                      {testingModel ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Run Test
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/30 min-h-[150px]">
                    {testingModel ? (
                      <div className="flex justify-center items-center h-[150px]">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : testResponse ? (
                      <ScrollArea className="h-[150px]">
                        <div className="whitespace-pre-wrap">
                          {testResponse}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center text-muted-foreground h-[150px] flex items-center justify-center">
                        <p>
                          Click "Run Test" to test the model with a sample
                          prompt
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {testMetrics && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="border rounded-md p-3">
                        <div className="text-muted-foreground mb-1">
                          Response Time
                        </div>
                        <div className="text-xl font-bold">
                          {testMetrics.responseTime} ms
                        </div>
                      </div>

                      {testMetrics.tokenUsage && (
                        <div className="border rounded-md p-3">
                          <div className="text-muted-foreground mb-1">
                            Token Usage
                          </div>
                          <div className="text-xl font-bold">
                            {testMetrics.tokenUsage.total_tokens || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab("models")}>
                Back to Models
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Providers Overview Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Providers</CardTitle>
              <CardDescription>
                Overview of your configured AI providers
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
                    Connect an AI provider to start creating models
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/ai-providers")}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Provider
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Sparkles className="h-5 w-5 text-primary" />
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              API Key:
                            </span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {showApiKeys[provider.id]
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
                              {showApiKeys[provider.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = "/ai-providers")}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Configure
                      </Button>
                    </div>
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
