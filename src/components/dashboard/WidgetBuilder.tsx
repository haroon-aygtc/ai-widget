import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Save, Loader2 } from "lucide-react";
import { useWidgetStore, Widget, WidgetConfig } from "@/lib/store";
import { useAIProviderStore } from "@/lib/store";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Import modular components
import { WidgetHeader } from "@/components/widget-builder/widget-header";
import { DesignTab } from "@/components/widget-builder/design-tab";
import { BehaviorTab } from "@/components/widget-builder/behavior-tab";
import { PlacementTab } from "@/components/widget-builder/placement-tab";
import { WidgetPreviewPanel } from "@/components/widget-builder/widget-preview-panel";

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

  // Load default configuration from system settings
  useEffect(() => {
    const loadDefaultConfig = async () => {
      try {
        const response = await api.get('/system-settings/widget-defaults');
        if (response.data.success) {
          setWidgetConfig(response.data.data);
        }
      } catch (error) {
        console.warn('Failed to load default widget configuration, using fallback');
      }
    };

    if (!currentWidget) {
      loadDefaultConfig();
    }
  }, [currentWidget]);

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
        await updateWidget(currentWidget.id, widgetData as Widget);
        toast({
          title: "Success",
          description: "Widget updated successfully!",
        });
      } else {
        await createWidget(widgetData as Widget);
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
      <WidgetHeader
        widgetName={widgetName}
        widgetDescription={widgetDescription}
        onNameChange={setWidgetName}
        onDescriptionChange={setWidgetDescription}
        onSave={saveWidget}
        onCopyEmbedCode={copyEmbedCode}
        saving={saving}
        isLoading={isLoading}
        isEditing={!!currentWidget?.id}
        hasCurrentWidget={!!currentWidget?.id}
      />

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
              <DesignTab
                config={widgetConfig.design}
                onChange={handleDesignChange}
              />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 mt-4">
              <BehaviorTab
                config={widgetConfig.behavior}
                onChange={handleBehaviorChange}
                selectedAIProvider={selectedAIProvider}
                onAIProviderChange={setSelectedAIProvider}
                providers={providers}
              />
            </TabsContent>

            <TabsContent value="placement" className="space-y-4 mt-4">
              <PlacementTab
                config={widgetConfig.placement}
                onChange={handlePlacementChange}
              />
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

        <WidgetPreviewPanel
          config={widgetConfig as WidgetConfig}
          onCopyEmbedCode={copyEmbedCode}
          hasCurrentWidget={!!currentWidget?.id}
        />
      </div>
    </div>
  );
};

export default WidgetBuilder;
