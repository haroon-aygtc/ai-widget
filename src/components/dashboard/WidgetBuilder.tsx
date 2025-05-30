import React, { useState } from "react";
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
import { Check, Code, Copy, Eye, Save, Settings } from "lucide-react";
import WidgetPreview from "./WidgetPreview";

const WidgetBuilder = () => {
  const [activeTab, setActiveTab] = useState("design");
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
      position: "bottom-right",
    },
    behavior: {
      initialMessage: "Hello! How can I help you today?",
      typingIndicator: true,
      showTimestamp: true,
      autoResponse: true,
      responseDelay: 500,
      maxMessages: 50,
      aiProvider: "openai",
      welcomeMessage:
        "Welcome to our AI chat assistant. How can I help you today?",
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
      triggerIcon: "message",
    },
  });

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
    try {
      // Import the API service
      const { widgetApi } = await import("@/lib/api");

      // Call the create endpoint
      const response = await widgetApi.create({
        name: "New Widget", // TODO: Add name input field
        design: widgetConfig.design,
        behavior: widgetConfig.behavior,
        placement: widgetConfig.placement,
        status: "active",
      });

      console.log("Widget saved successfully:", response.data);
      alert("Widget saved successfully!");
    } catch (error) {
      console.error("Save widget error:", error);
      alert("Failed to save widget. Please try again.");
    }
  };

  const generateEmbedCode = async (widgetId: string) => {
    try {
      // Import the API service
      const { widgetApi } = await import("@/lib/api");

      // Call the generate embed code endpoint
      const response = await widgetApi.generateEmbedCode(widgetId);

      return `<script src="${window.location.origin}/widget.js" data-widget-id="${response.data.embed_code}"></script>`;
    } catch (error) {
      console.error("Generate embed code error:", error);
      return `<script src="${window.location.origin}/widget.js" data-widget-id="widget-demo"></script>`;
    }
  };

  const copyEmbedCode = async () => {
    // For demo purposes, we'll use a hardcoded widget ID
    // In a real implementation, this would be the ID of the saved widget
    const widgetId = "demo-widget-123";

    const code = await generateEmbedCode(widgetId);
    navigator.clipboard.writeText(code);

    // Show toast notification
    alert("Embed code copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Widget Builder</h1>
          <p className="text-muted-foreground">Customize your AI chat widget</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveWidget}>
            <Save className="mr-2 h-4 w-4" />
            Save Widget
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
                    Select and configure your AI provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>AI Provider</Label>
                      <Select
                        value={widgetConfig.behavior.aiProvider}
                        onValueChange={(value) =>
                          handleBehaviorChange("aiProvider", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="claude">
                            Anthropic Claude
                          </SelectItem>
                          <SelectItem value="mistral">Mistral AI</SelectItem>
                          <SelectItem value="huggingface">
                            HuggingFace
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Provider Settings
                    </Button>
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
            <Button variant="outline" onClick={() => {}}>
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyEmbedCode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Embed Code
              </Button>
              <Button onClick={saveWidget}>
                <Save className="mr-2 h-4 w-4" />
                Save Widget
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
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Code className="mr-2 h-4 w-4" />
                View Embed Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetBuilder;
