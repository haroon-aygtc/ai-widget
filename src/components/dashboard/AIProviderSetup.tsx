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
import { CheckCircle, AlertCircle, Settings, Key, Zap, Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, Sparkles } from "lucide-react";

interface AIProviderSetupProps {
  onSave?: (config: AIProviderConfig) => void;
}

interface AIProviderConfig {
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

const AIProviderSetup: React.FC<AIProviderSetupProps> = ({
  onSave = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<string>("providers");
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  
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

  const availableProviders = [
    { id: "openai", name: "OpenAI", logo: "🤖", description: "GPT-4, GPT-3.5 Turbo models" },
    { id: "gemini", name: "Google Gemini", logo: "🌀", description: "Gemini Pro, Ultra models" },
    { id: "claude", name: "Anthropic Claude", logo: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
    { id: "mistral", name: "Mistral AI", logo: "🌪️", description: "Mistral Large, Medium, Small" },
    { id: "groq", name: "Groq", logo: "⚡", description: "Ultra-fast inference" },
    { id: "huggingface", name: "HuggingFace", logo: "🤗", description: "Open source models" },
    { id: "grok", name: "Grok (X.AI)", logo: "✖️", description: "Grok-1 model" },
    { id: "openrouter", name: "OpenRouter", logo: "🔄", description: "Multiple model access" },
    { id: "deepseek", name: "DeepSeek", logo: "🔍", description: "DeepSeek Chat, Coder" },
  ];

  const modelsByProvider: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4-vision"],
    gemini: ["gemini-pro", "gemini-ultra", "gemini-flash"],
    claude: [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    mistral: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
    ],
    groq: ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"],
    huggingface: [
      "meta-llama/Llama-2-70b-chat-hf",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "google/gemma-7b",
    ],
    grok: ["grok-1"],
    openrouter: [
      "openai/gpt-4o",
      "anthropic/claude-3-opus",
      "meta-llama/llama-3-70b-instruct",
    ],
    deepseek: ["deepseek-chat", "deepseek-coder"],
  };

  // Load providers on component mount
  useEffect(() => {
    // Mock data - replace with actual API call
    setProviders([
      {
        id: "1",
        provider_type: "openai",
        api_key: "sk-*********************",
        model: "gpt-4o",
        is_active: true,
        created_at: "2024-01-15T10:30:00Z",
        last_used: "2024-01-20T14:22:00Z",
      },
      {
        id: "2",
        provider_type: "claude",
        api_key: "sk-ant-*********************",
        model: "claude-3-opus-20240229",
        is_active: false,
        created_at: "2024-01-10T09:15:00Z",
        last_used: "2024-01-18T16:45:00Z",
      },
    ]);
  }, []);

  const handleProviderSelect = (provider: any) => {
    setSelectedProvider(provider);
    setFormData({
      provider_type: provider.provider_type,
      api_key: provider.api_key,
      model: provider.model,
      temperature: provider.temperature || 0.7,
      max_tokens: provider.max_tokens || 2048,
      system_prompt: provider.system_prompt || "You are a helpful assistant.",
      stream_response: provider.stream_response ?? true,
      context_window: provider.context_window || 4096,
      top_p: provider.top_p || 0.95,
      is_active: provider.is_active,
    });
    setIsEditing(true);
    setActiveTab("configure");
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    setFormData({
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
    setIsEditing(false);
    setActiveTab("configure");
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
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
        provider: activeProvider,
        apiKey: apiKey,
      });

      if (response.data.success) {
        setTestStatus("success");
        setTestMessage(response.data.message || "Connection successful!");

        // If models were returned, update the model dropdown
        if (response.data.models && response.data.models.length > 0) {
          // Update the modelsByProvider for this provider
          const updatedModels = [...response.data.models];
          setModel(updatedModels[0]); // Set the first model as selected
        }
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
      provider: activeProvider,
      apiKey,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      advancedSettings: {
        streamResponse,
        contextWindow,
        topP,
      },
    };

    try {
      // Import the store
      const { useAIProviderStore } = await import("@/lib/store");
      const createProvider = useAIProviderStore.getState().createProvider;

      // Call the create function
      await createProvider(config);

      // Call the onSave callback
      onSave(config);

      // Show success message
      alert("AI Provider configuration saved successfully!");
    } catch (error) {
      console.error("Save configuration error:", error);
      alert("Failed to save configuration. Please try again.");
    }
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Provider Setup</h1>
          <p className="text-muted-foreground">
            Connect and configure your AI providers for chat widgets
          </p>
        </div>
        <Button onClick={handleNewProvider} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                  <h3 className="text-lg font-semibold mb-2">No providers configured</h3>
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
                            {availableProviders.find(p => p.id === provider.provider_type)?.logo || "🤖"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold capitalize">{provider.provider_type}</h3>
                            <Badge variant={provider.is_active ? "default" : "secondary"}>
                              {provider.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Model: {provider.model} • Last used: {new Date(provider.last_used).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">API Key:</span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {showApiKey[provider.id] ? provider.api_key : provider.api_key.replace(/./g, '*')}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleApiKeyVisibility(provider.id)}
                            >
                              {showApiKey[provider.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
                Choose from our supported AI providers to add to your configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProviders.map((provider) => (
                  <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{provider.logo}</span>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-xs text-muted-foreground">{provider.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, provider_type: provider.id }));
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

        <Card>
          <CardHeader>
            <CardTitle>Provider Configuration</CardTitle>
            <CardDescription>
              Set up your {providers.find((p) => p.id === activeProvider)?.name}{" "}
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
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        placeholder={`Enter your ${activeProvider} API key`}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleTestConnection}
                      >
                        <Zap className="h-4 w-4" />
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
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsByProvider[activeProvider]?.map(
                          (modelOption) => (
                            <SelectItem key={modelOption} value={modelOption}>
                              {modelOption}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperature: {temperature}
                    </Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) =>
                        setTemperature(parseFloat(e.target.value))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness: Lower values are more deterministic,
                      higher values more creative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
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
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
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
                      checked={streamResponse}
                      onCheckedChange={setStreamResponse}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="context-window">Context Window</Label>
                    <Input
                      id="context-window"
                      type="number"
                      value={contextWindow}
                      onChange={(e) =>
                        setContextWindow(parseInt(e.target.value))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of previous messages to include as context
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="top-p">Top P: {topP}</Label>
                    <Input
                      id="top-p"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls diversity via nucleus sampling
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" className="w-full" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Additional Provider Settings
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Reset to Defaults</Button>
            <Button onClick={handleSaveConfiguration}>
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AIProviderSetup;
