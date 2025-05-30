import React, { useState } from "react";
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
import { CheckCircle, AlertCircle, Settings, Key, Zap } from "lucide-react";

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
  const [activeProvider, setActiveProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are a helpful assistant.",
  );
  const [streamResponse, setStreamResponse] = useState<boolean>(true);
  const [contextWindow, setContextWindow] = useState<number>(4096);
  const [topP, setTopP] = useState<number>(0.95);
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  const providers = [
    { id: "openai", name: "OpenAI", logo: "🤖" },
    { id: "gemini", name: "Google Gemini", logo: "🌀" },
    { id: "claude", name: "Anthropic Claude", logo: "🧠" },
    { id: "mistral", name: "Mistral AI", logo: "🌪️" },
    { id: "groq", name: "Groq", logo: "⚡" },
    { id: "huggingface", name: "HuggingFace", logo: "🤗" },
  ];

  const modelsByProvider: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4-vision"],
    gemini: ["gemini-pro", "gemini-ultra", "gemini-flash"],
    claude: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    mistral: ["mistral-large", "mistral-medium", "mistral-small"],
    groq: ["llama3-70b", "llama3-8b", "mixtral-8x7b"],
    huggingface: [
      "meta-llama/Llama-2-70b",
      "mistralai/Mixtral-8x7B",
      "google/gemma-7b",
    ],
  };

  const handleProviderChange = (provider: string) => {
    setActiveProvider(provider);
    setModel(modelsByProvider[provider][0]);
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
      // Import the API service
      const { aiProviderApi } = await import("@/lib/api");

      // Call the create endpoint
      await aiProviderApi.create(config);

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
    <div className="bg-background p-6 rounded-lg w-full">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Provider Setup</h1>
          <p className="text-muted-foreground">
            Connect and configure your preferred AI provider
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select AI Provider</CardTitle>
            <CardDescription>
              Choose the AI service you want to use with your chat widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant={
                    activeProvider === provider.id ? "default" : "outline"
                  }
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <span className="text-2xl">{provider.logo}</span>
                  <span>{provider.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
