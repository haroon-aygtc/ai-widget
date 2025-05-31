import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Check, Code, Copy, Eye, Save, Settings, Loader2 } from "lucide-react";
import WidgetPreview from "./WidgetPreview";
import { useWidgetStore } from "@/lib/store";
import { useAIProviderStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";

const WidgetBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentWidget, createWidget, updateWidget, isLoading } =
    useWidgetStore();
  const { providers, fetchProviders } = useAIProviderStore();

  const [activeTab, setActiveTab] = useState("design");
  const [widgetName, setWidgetName] = useState("");
  const [widgetDescription, setWidgetDescription] = useState("");
  const [selectedAIProvider, setSelectedAIProvider] = useState("");
  const [saving, setSaving] = useState(false);

  const [widgetConfig, setWidgetConfig] = useState({
    design: {
      primaryColor: "#3b82f6",
      secondaryColor: "#f3f4f6",
      textColor: "#111827",
      fontFamily: "Inter",
      fontSize: 14,
      borderRadius: 8,
      headerText: "Chat with AI Assistant",
      buttonText: "Send",
      placeholderText: "Type your message here...",
    },
    behavior: {
      welcomeMessage:
        "Welcome to our AI chat assistant. How can I help you today?",
      initialMessage: "Hello! How can I help you today?",
      typingIndicator: true,
      showTimestamp: true,
      autoResponse: true,
      responseDelay: 500,
      maxMessages: 50,
    },
    placement: {
      position: "bottom-right",
      offsetX: 20,
      offsetY: 20,
      mobilePosition: "bottom",
      showOnPages: "all",
      excludePages: "",
      triggerType: "button",
      triggerText: "Chat with us",
    },
  });

  // Load AI providers and current widget on mount
  useEffect(() => {
    fetchProviders();

    if (currentWidget) {
      setWidgetName(currentWidget.name);
      setWidgetDescription(currentWidget.description || "");
      setSelectedAIProvider(currentWidget.ai_provider_id || "");

      if (currentWidget.design) {
        setWidgetConfig((prev) => ({
          ...prev,
          design: { ...prev.design, ...currentWidget.design },
        }));
      }

      if (currentWidget.behavior) {
        setWidgetConfig((prev) => ({
          ...prev,
          behavior: { ...prev.behavior, ...currentWidget.behavior },
        }));
      }

      if (currentWidget.placement) {
        setWidgetConfig((prev) => ({
          ...prev,
          placement: { ...prev.placement, ...currentWidget.placement },
        }));
      }
    }
  }, [currentWidget, fetchProviders]);

  const handleDesignChange = (field: string, value: any) => {
    setWidgetConfig({
      ...widgetConfig,
      design: {
        ...widgetConfig.design,
        [field]: value,
      },
    });
  };

  const handleBehaviorChange = (field: string, value: any) => {
    setWidgetConfig({
      ...widgetConfig,
      behavior: {
        ...widgetConfig.behavior,
        [field]: value,
      },
    });
  };

  const handlePlacementChange = (field: string, value: any) => {
    setWidgetConfig({
      ...widgetConfig,
      placement: {
        ...widgetConfig.placement,
        [field]: value,
      },
    });
  };

  const saveWidget = async () => {
    if (!widgetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a widget name",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const widgetData = {
        name: widgetName,
        description: widgetDescription,
        ai_provider_id: selectedAIProvider || null,
        design: widgetConfig.design,
        behavior: widgetConfig.behavior,
        placement: widgetConfig.placement,
        status: "active",
      };

      if (currentWidget?.id) {
        await updateWidget(currentWidget.id, widgetData);
        toast({
          title: "Success",
          description: "Widget updated successfully!",
        });
      } else {
        await createWidget(widgetData);
        toast({
          title: "Success",
          description: "Widget created successfully!",
        });
      }

      navigate("/widgets");
    } catch (error: any) {
      console.error("Save widget error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to save widget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const generateEmbedCode = async (widgetId: string) => {
    try {
      const embedCode = await useWidgetStore
        .getState()
        .generateEmbedCode(widgetId);
      return `<script src="${window.location.origin}/widget.js" data-widget-id="${embedCode}"></script>`;
    } catch (error) {
      console.error("Generate embed code error:", error);
      throw error;
    }
  };

  const copyEmbedCode = async () => {
    if (!currentWidget?.id) {
      toast({
        title: "Error",
        description: "Please save the widget first to generate embed code",
        variant: "destructive",
      });
      return;
    }

    try {
      const code = await generateEmbedCode(currentWidget.id);
      await navigator.clipboard.writeText(code);

      toast({
        title: "Success",
        description: "Embed code copied to clipboard!",
      });
    } catch (error) {
      console.error("Copy embed code error:", error);
      toast({
        title: "Error",
        description: "Failed to copy embed code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex-1 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="widget-name">Widget Name</Label>
            <Input
              id="widget-name"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="Enter widget name"
              className="text-lg font-semibold"
            />
          </div>
          <div className="mt-2 space-y-2">
            <Label htmlFor="widget-description">Description (Optional)</Label>
            <Input
              id="widget-description"
              value={widgetDescription}
              onChange={(e) => setWidgetDescription(e.target.value)}
              placeholder="Brief description of your widget"
              className="text-sm text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={copyEmbedCode}
            disabled={!currentWidget?.id}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Embed Code
          </Button>
          <Button onClick={saveWidget} disabled={saving || isLoading}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {currentWidget?.id ? "Update Widget" : "Save Widget"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 overflow-auto p-6">
          <Tabs
            defaultValue="design"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Configure Behavior</TabsTrigger>
              <TabsTrigger value="placement">Widget Placement</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Colors & Typography</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <ColorPicker
                        value={widgetConfig.design.primaryColor}
                        onChange={(value) =>
                          handleDesignChange("primaryColor", value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <ColorPicker
                        value={widgetConfig.design.secondaryColor}
                        onChange={(value) =>
                          handleDesignChange("secondaryColor", value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <ColorPicker
                        value={widgetConfig.design.textColor}
                        onChange={(value) =>
                          handleDesignChange("textColor", value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={widgetConfig.design.fontFamily}
                        onValueChange={(value) =>
                          handleDesignChange("fontFamily", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>
                        Font Size ({widgetConfig.design.fontSize}px)
                      </Label>
                    </div>
                    <Slider
                      value={[widgetConfig.design.fontSize]}
                      min={10}
                      max={20}
                      step={1}
                      onValueChange={(value) =>
                        handleDesignChange("fontSize", value[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>
                        Border Radius ({widgetConfig.design.borderRadius}px)
                      </Label>
                    </div>
                    <Slider
                      value={[widgetConfig.design.borderRadius]}
                      min={0}
                      max={20}
                      step={1}
                      onValueChange={(value) =>
                        handleDesignChange("borderRadius", value[0])
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Elements</CardTitle>
                  <CardDescription>
                    Customize the text displayed in your widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Header Text</Label>
                    <Input
                      value={widgetConfig.design.headerText}
                      onChange={(e) =>
                        handleDesignChange("headerText", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={widgetConfig.design.buttonText}
                      onChange={(e) =>
                        handleDesignChange("buttonText", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placeholder Text</Label>
                    <Input
                      value={widgetConfig.design.placeholderText}
                      onChange={(e) =>
                        handleDesignChange("placeholderText", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Behavior</CardTitle>
                  <CardDescription>
                    Configure how your chat widget behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={widgetConfig.behavior.welcomeMessage}
                      onChange={(e) =>
                        handleBehaviorChange("welcomeMessage", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Message</Label>
                    <Textarea
                      value={widgetConfig.behavior.initialMessage}
                      onChange={(e) =>
                        handleBehaviorChange("initialMessage", e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="typing-indicator">
                        Show Typing Indicator
                      </Label>
                      <Switch
                        id="typing-indicator"
                        checked={widgetConfig.behavior.typingIndicator}
                        onCheckedChange={(checked) =>
                          handleBehaviorChange("typingIndicator", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="show-timestamp">
                        Show Message Timestamps
                      </Label>
                      <Switch
                        id="show-timestamp"
                        checked={widgetConfig.behavior.showTimestamp}
                        onCheckedChange={(checked) =>
                          handleBehaviorChange("showTimestamp", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="auto-response">Auto Response</Label>
                      <Switch
                        id="auto-response"
                        checked={widgetConfig.behavior.autoResponse}
                        onCheckedChange={(checked) =>
                          handleBehaviorChange("autoResponse", checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>
                        Response Delay ({widgetConfig.behavior.responseDelay}ms)
                      </Label>
                    </div>
                    <Slider
                      value={[widgetConfig.behavior.responseDelay]}
                      min={0}
                      max={2000}
                      step={100}
                      onValueChange={(value) =>
                        handleBehaviorChange("responseDelay", value[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Messages History</Label>
                    <Select
                      value={widgetConfig.behavior.maxMessages.toString()}
                      onValueChange={(value) =>
                        handleBehaviorChange("maxMessages", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 messages</SelectItem>
                        <SelectItem value="25">25 messages</SelectItem>
                        <SelectItem value="50">50 messages</SelectItem>
                        <SelectItem value="100">100 messages</SelectItem>
                        <SelectItem value="200">200 messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Provider</CardTitle>
                  <CardDescription>
                    Select your configured AI provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>AI Provider</Label>
                      <Select
                        value={selectedAIProvider}
                        onValueChange={setSelectedAIProvider}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Provider</SelectItem>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.provider_type} - {provider.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {providers.length === 0 && (
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                        No AI providers configured.
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal"
                          onClick={() => navigate("/ai-providers")}
                        >
                          Set up a provider first
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="placement" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Position</CardTitle>
                  <CardDescription>
                    Configure where your widget appears on the page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Desktop Position</Label>
                      <RadioGroup
                        value={widgetConfig.placement.position}
                        onValueChange={(value) =>
                          handlePlacementChange("position", value)
                        }
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem
                            value="bottom-right"
                            id="bottom-right"
                          />
                          <Label htmlFor="bottom-right">Bottom Right</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem
                            value="bottom-left"
                            id="bottom-left"
                          />
                          <Label htmlFor="bottom-left">Bottom Left</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="top-right" id="top-right" />
                          <Label htmlFor="top-right">Top Right</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="top-left" id="top-left" />
                          <Label htmlFor="top-left">Top Left</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>
                          Horizontal Offset ({widgetConfig.placement.offsetX}px)
                        </Label>
                        <Slider
                          value={[widgetConfig.placement.offsetX]}
                          min={0}
                          max={50}
                          step={1}
                          onValueChange={(value) =>
                            handlePlacementChange("offsetX", value[0])
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Vertical Offset ({widgetConfig.placement.offsetY}px)
                        </Label>
                        <Slider
                          value={[widgetConfig.placement.offsetY]}
                          min={0}
                          max={50}
                          step={1}
                          onValueChange={(value) =>
                            handlePlacementChange("offsetY", value[0])
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile Position</Label>
                      <Select
                        value={widgetConfig.placement.mobilePosition}
                        onValueChange={(value) =>
                          handlePlacementChange("mobilePosition", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom">
                            Bottom Full Width
                          </SelectItem>
                          <SelectItem value="bottom-right">
                            Bottom Right
                          </SelectItem>
                          <SelectItem value="bottom-left">
                            Bottom Left
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Rules</CardTitle>
                  <CardDescription>
                    Control when and where your widget appears
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Show On Pages</Label>
                      <Select
                        value={widgetConfig.placement.showOnPages}
                        onValueChange={(value) =>
                          handlePlacementChange("showOnPages", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="specific">
                            Specific Pages
                          </SelectItem>
                          <SelectItem value="homepage">
                            Homepage Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {widgetConfig.placement.showOnPages === "specific" && (
                      <div className="space-y-2">
                        <Label>Page URLs (one per line)</Label>
                        <Textarea
                          placeholder="/about\n/contact\n/products/*"
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Exclude Pages (one per line)</Label>
                      <Textarea
                        value={widgetConfig.placement.excludePages}
                        onChange={(e) =>
                          handlePlacementChange("excludePages", e.target.value)
                        }
                        placeholder="/checkout\n/account/*\n/admin/*"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Widget Trigger Type</Label>
                      <Select
                        value={widgetConfig.placement.triggerType}
                        onValueChange={(value) =>
                          handlePlacementChange("triggerType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="button">Button</SelectItem>
                          <SelectItem value="tab">Side Tab</SelectItem>
                          <SelectItem value="auto">Auto Open</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {widgetConfig.placement.triggerType !== "auto" && (
                      <div className="space-y-2">
                        <Label>Trigger Text</Label>
                        <Input
                          value={widgetConfig.placement.triggerText}
                          onChange={(e) =>
                            handlePlacementChange("triggerText", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => navigate("/widgets")}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyEmbedCode}
                disabled={!currentWidget?.id}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Embed Code
              </Button>
              <Button onClick={saveWidget} disabled={saving || isLoading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {currentWidget?.id ? "Update Widget" : "Save Widget"}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l p-4 sm:p-6 bg-muted/20">
          <div className="sticky top-6">
            <h3 className="text-lg font-medium mb-4">Live Preview</h3>
            <div className="bg-background rounded-lg border shadow-sm p-4 h-[600px] overflow-hidden">
              <WidgetPreview config={widgetConfig} />
            </div>
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={copyEmbedCode}
                disabled={!currentWidget?.id}
              >
                <Code className="mr-2 h-4 w-4" />
                Copy Embed Code
              </Button>
              {!currentWidget?.id && (
                <p className="text-xs text-muted-foreground text-center">
                  Save widget first to get embed code
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetBuilder;
