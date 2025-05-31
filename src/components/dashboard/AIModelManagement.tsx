import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { aiModelApi } from "@/lib/models-api";
import { aiProviderApi } from "@/lib/api";
import { Search, Plus, Trash2, Edit, Star, RefreshCw, Check, X, Sparkles, Zap } from "lucide-react";

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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
    const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [testingModel, setTestingModel] = useState(false);
    const [testResponse, setTestResponse] = useState<string>("");
    const [testMetrics, setTestMetrics] = useState<Record<string, any> | null>(null);

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
                search: searchQuery || undefined,
                provider_type: providerFilter || undefined,
                is_active: activeFilter ? activeFilter === "active" : undefined,
            };

            const response = await aiModelApi.getAll(params);
            console.log("Models API response:", response.data);
            const modelsData = response.data?.data || response.data || [];
            setModels(Array.isArray(modelsData) ? modelsData : []);

            const total = response.data?.total || 0;
            const perPage = response.data?.per_page || 10;
            setTotalPages(Math.ceil(total / perPage));
        } catch (error) {
            console.error("Failed to fetch models:", error);
            setModels([]); // Set empty array on error
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
            const response = await aiProviderApi.getAll();
            console.log("Providers API response:", response.data);
            const providersData = response.data?.data || response.data || [];
            setProviders(Array.isArray(providersData) ? providersData : []);
        } catch (error) {
            console.error("Failed to fetch providers:", error);
            setProviders([]); // Set empty array on error
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
            const response = await aiModelApi.fetchAvailableModels({
                provider: providerType,
                api_key: apiKey,
            });

            if (response.data.success && response.data.models) {
                setAvailableModels(response.data.models);
            } else {
                setAvailableModels([]);
                toast({
                    title: "Warning",
                    description: response.data.message || "No models found for this provider",
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
        setFormData({ ...formData, provider_type: value, model_id: "", ai_provider_id: "" });

        // Find provider with matching type
        const selectedProvider = (providers || []).find(p => p.provider_type === value);
        if (selectedProvider) {
            setFormData(prev => ({
                ...prev,
                provider_type: value,
                model_id: "",
                ai_provider_id: selectedProvider.id,
            }));

            // Fetch available models for this provider
            fetchAvailableModels(value, selectedProvider.api_key);
        } else {
            setAvailableModels([]);
        }
    };

    const handleModelSelect = (modelId: string) => {
        const selectedModelOption = (availableModels || []).find(m => m.id === modelId);
        if (selectedModelOption) {
            setFormData(prev => ({
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
        if (!formData.provider_type.trim()) errors.provider_type = "Provider is required";
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
            const response = await aiModelApi.create(formData);
            toast({
                title: "Success",
                description: "AI model created successfully",
            });
            setIsCreateDialogOpen(false);
            resetForm();
            fetchModels();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to create AI model";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });

            // Set validation errors from backend
            if (error.response?.data?.errors) {
                const backendErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
                    backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setFormErrors(backendErrors);
            }
        }
    };

    const handleUpdateModel = async () => {
        if (!selectedModel || !validateForm()) return;

        try {
            const response = await aiModelApi.update(selectedModel.id, formData);
            toast({
                title: "Success",
                description: "AI model updated successfully",
            });
            setIsEditDialogOpen(false);
            resetForm();
            fetchModels();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to update AI model";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });

            // Set validation errors from backend
            if (error.response?.data?.errors) {
                const backendErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
                    backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setFormErrors(backendErrors);
            }
        }
    };

    const handleDeleteModel = async (id: string) => {
        if (!confirm("Are you sure you want to delete this model?")) return;

        try {
            await aiModelApi.delete(id);
            toast({
                title: "Success",
                description: "AI model deleted successfully",
            });
            fetchModels();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete AI model",
                variant: "destructive",
            });
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const response = await aiModelApi.toggleActive(id);
            toast({
                title: "Success",
                description: `Model ${response.data.is_active ? "activated" : "deactivated"} successfully`,
            });
            fetchModels();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update model status",
                variant: "destructive",
            });
        }
    };

    const handleToggleFeatured = async (id: string) => {
        try {
            const response = await aiModelApi.toggleFeatured(id);
            toast({
                title: "Success",
                description: `Model ${response.data.is_featured ? "featured" : "unfeatured"} successfully`,
            });
            fetchModels();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update featured status",
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

            // Find the provider to get the API key
            const selectedProvider = (providers || []).find(p => p.provider_type === formData.provider_type);
            if (!selectedProvider) {
                throw new Error("Provider not found");
            }

            const response = await aiModelApi.testModel({
                provider: formData.provider_type,
                model_id: formData.model_id,
                api_key: selectedProvider.api_key,
                temperature: formData.temperature,
                max_tokens: formData.max_tokens,
                system_prompt: formData.system_prompt,
            });

            if (response.data.success) {
                setTestResponse(response.data.response || "Test successful, but no response content");
                setTestMetrics(response.data.metrics || null);
                toast({
                    title: "Success",
                    description: "Model test completed successfully",
                });
            } else {
                setTestResponse("Test failed: " + (response.data.message || "Unknown error"));
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

    const openEditDialog = (model: AIModel) => {
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

        // Fetch available models for this provider
        const selectedProvider = (providers || []).find(p => p.provider_type === model.provider_type);
        if (selectedProvider) {
            fetchAvailableModels(model.provider_type, selectedProvider.api_key);
        }

        setIsEditDialogOpen(true);
    };

    const openTestDialog = (model: AIModel) => {
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
        setIsTestDialogOpen(true);
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

    const openCreateDialog = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">AI Model Management</h2>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Model
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Models</CardTitle>
                    <CardDescription>Manage your AI models and their configurations</CardDescription>
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
                            <Select value={providerFilter} onValueChange={setProviderFilter}>
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
                        <div className="text-center py-8 text-muted-foreground">
                            No models found. Create your first AI model to get started.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted p-4 font-medium">
                                <div className="col-span-3">Name</div>
                                <div className="col-span-2">Provider</div>
                                <div className="col-span-3">Model ID</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {(models || []).map((model) => (
                                <div key={model.id} className="grid grid-cols-12 p-4 border-t items-center">
                                    <div className="col-span-3 font-medium flex items-center gap-2">
                                        {model.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                                        {model.name}
                                    </div>
                                    <div className="col-span-2">
                                        <Badge variant="outline" className="capitalize">
                                            {model.provider_type}
                                        </Badge>
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        {model.model_id}
                                    </div>
                                    <div className="col-span-2">
                                        {model.is_active ? (
                                            <Badge variant="default" className="bg-green-500">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openTestDialog(model)}
                                            title="Test Model"
                                        >
                                            <Zap className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(model)}
                                            title="Edit Model"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleActive(model.id)}
                                            title={model.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {model.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleFeatured(model.id)}
                                            title={model.is_featured ? "Remove from featured" : "Add to featured"}
                                        >
                                            <Star className={`h-4 w-4 ${model.is_featured ? "text-yellow-500" : ""}`} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteModel(model.id)}
                                            title="Delete Model"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
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
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className="w-8 h-8 p-0"
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Model Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New AI Model</DialogTitle>
                        <DialogDescription>
                            Configure a new AI model for use in your applications.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic">
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
                                        <SelectTrigger id="provider_type" className={formErrors.provider_type ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(providers || []).map(provider => (
                                                <SelectItem key={provider.id} value={provider.provider_type}>
                                                    {provider.provider_type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.provider_type && (
                                        <p className="text-sm text-red-500">{formErrors.provider_type}</p>
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
                                            <SelectTrigger id="model_id" className={formErrors.model_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder={fetchingModels ? "Loading models..." : "Select Model"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(availableModels || []).map(model => (
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
                                        <p className="text-sm text-red-500">{formErrors.model_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description of this model's capabilities and use cases"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                />
                                <Label htmlFor="is_featured">Featured</Label>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.temperature < 0.3 ? "More deterministic" : formData.temperature > 1.2 ? "More creative" : "Balanced"}
                                    </span>
                                </div>
                                <Slider
                                    id="temperature"
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={[formData.temperature]}
                                    onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                                    className={formErrors.temperature ? "border-red-500" : ""}
                                />
                                {formErrors.temperature && (
                                    <p className="text-sm text-red-500">{formErrors.temperature}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
                                <Slider
                                    id="max_tokens"
                                    min={100}
                                    max={8000}
                                    step={100}
                                    value={[formData.max_tokens]}
                                    onValueChange={(value) => setFormData({ ...formData, max_tokens: value[0] })}
                                    className={formErrors.max_tokens ? "border-red-500" : ""}
                                />
                                {formErrors.max_tokens && (
                                    <p className="text-sm text-red-500">{formErrors.max_tokens}</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="system" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">System Prompt</Label>
                                <Textarea
                                    id="system_prompt"
                                    value={formData.system_prompt}
                                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                                    placeholder="Instructions that define how the AI should behave"
                                    className="min-h-[200px]"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateModel}>Create Model</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Model Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit AI Model</DialogTitle>
                        <DialogDescription>
                            Update your AI model configuration.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                            <TabsTrigger value="system">System Prompt</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_provider_type">Provider</Label>
                                    <Select
                                        value={formData.provider_type}
                                        onValueChange={handleProviderChange}
                                    >
                                        <SelectTrigger id="edit_provider_type" className={formErrors.provider_type ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(providers || []).map(provider => (
                                                <SelectItem key={provider.id} value={provider.provider_type}>
                                                    {provider.provider_type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.provider_type && (
                                        <p className="text-sm text-red-500">{formErrors.provider_type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit_model_id">Model</Label>
                                    <div className="relative">
                                        <Select
                                            value={formData.model_id}
                                            onValueChange={handleModelSelect}
                                            disabled={!formData.provider_type || fetchingModels}
                                        >
                                            <SelectTrigger id="edit_model_id" className={formErrors.model_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder={fetchingModels ? "Loading models..." : "Select Model"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(availableModels || []).map(model => (
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
                                        <p className="text-sm text-red-500">{formErrors.model_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_name">Display Name</Label>
                                <Input
                                    id="edit_name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={formErrors.name ? "border-red-500" : ""}
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-red-500">{formErrors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_description">Description</Label>
                                <Textarea
                                    id="edit_description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description of this model's capabilities and use cases"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="edit_is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="edit_is_active">Active</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="edit_is_featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                />
                                <Label htmlFor="edit_is_featured">Featured</Label>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label htmlFor="edit_temperature">Temperature: {formData.temperature}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.temperature < 0.3 ? "More deterministic" : formData.temperature > 1.2 ? "More creative" : "Balanced"}
                                    </span>
                                </div>
                                <Slider
                                    id="edit_temperature"
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={[formData.temperature]}
                                    onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                                    className={formErrors.temperature ? "border-red-500" : ""}
                                />
                                {formErrors.temperature && (
                                    <p className="text-sm text-red-500">{formErrors.temperature}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_max_tokens">Max Tokens: {formData.max_tokens}</Label>
                                <Slider
                                    id="edit_max_tokens"
                                    min={100}
                                    max={8000}
                                    step={100}
                                    value={[formData.max_tokens]}
                                    onValueChange={(value) => setFormData({ ...formData, max_tokens: value[0] })}
                                    className={formErrors.max_tokens ? "border-red-500" : ""}
                                />
                                {formErrors.max_tokens && (
                                    <p className="text-sm text-red-500">{formErrors.max_tokens}</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="system" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_system_prompt">System Prompt</Label>
                                <Textarea
                                    id="edit_system_prompt"
                                    value={formData.system_prompt}
                                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                                    placeholder="Instructions that define how the AI should behave"
                                    className="min-h-[200px]"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateModel}>Update Model</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Test Model Dialog */}
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Test AI Model</DialogTitle>
                        <DialogDescription>
                            Test the model with a sample prompt to verify it works correctly.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-medium mb-2">Model Information</h3>
                                <div className="text-sm space-y-1">
                                    <p><span className="font-medium">Name:</span> {formData.name}</p>
                                    <p><span className="font-medium">Provider:</span> {formData.provider_type}</p>
                                    <p><span className="font-medium">Model ID:</span> {formData.model_id}</p>
                                    <p><span className="font-medium">Temperature:</span> {formData.temperature}</p>
                                    <p><span className="font-medium">Max Tokens:</span> {formData.max_tokens}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Test Settings</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="test_temperature">Temperature: {formData.temperature}</Label>
                                    </div>
                                    <Slider
                                        id="test_temperature"
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        value={[formData.temperature]}
                                        onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
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
                                        <div className="whitespace-pre-wrap">{testResponse}</div>
                                    </ScrollArea>
                                ) : (
                                    <div className="text-center text-muted-foreground h-[150px] flex items-center justify-center">
                                        <p>Click "Run Test" to test the model with a sample prompt</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {testMetrics && (
                            <div className="space-y-2">
                                <h3 className="font-medium">Performance Metrics</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="border rounded-md p-3">
                                        <div className="text-muted-foreground mb-1">Response Time</div>
                                        <div className="text-xl font-bold">{testMetrics.responseTime} ms</div>
                                    </div>

                                    {testMetrics.tokenUsage && (
                                        <div className="border rounded-md p-3">
                                            <div className="text-muted-foreground mb-1">Token Usage</div>
                                            <div className="text-xl font-bold">{testMetrics.tokenUsage.total_tokens || 0}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AIModelManagement;
