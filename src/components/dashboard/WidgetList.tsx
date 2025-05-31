import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useWidgetStore } from "@/lib/store";
import { MessageSquare, ChevronRight, PlusCircle, Loader2 } from "lucide-react";

const WidgetList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { widgets, isLoading, error, fetchWidgets, deleteWidget, setCurrentWidget } = useWidgetStore();

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error, toast]);

  const handleEditWidget = (widget: any) => {
    setCurrentWidget(widget);
    navigate("/widget-builder");
  };

  const handleDeleteWidget = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this widget?")) {
      try {
        await deleteWidget(id);
        toast({
          title: "Widget deleted",
          description: "The widget has been deleted successfully.",
        });
      } catch (err) {
        // Error is handled by the store
      }
    }
  };

  // Ensure widgets is always an array
  const widgetList = Array.isArray(widgets) ? widgets : [];

  const activeWidgets = widgetList.filter((widget) => widget.status === "active");
  const draftWidgets = widgetList.filter((widget) => widget.status === "draft");
  const archivedWidgets = widgetList.filter((widget) => widget.status === "archived");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading widgets...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Widgets</CardTitle>
          <CardDescription>All your chat widgets</CardDescription>
        </div>
        <Button onClick={() => navigate("/widget-builder")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Widget
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active ({activeWidgets.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({draftWidgets.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedWidgets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active widgets found. Create your first widget!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onEdit={() => handleEditWidget(widget)}
                    onDelete={() => widget.id && handleDeleteWidget(widget.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            {draftWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No draft widgets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onEdit={() => handleEditWidget(widget)}
                    onDelete={() => widget.id && handleDeleteWidget(widget.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {archivedWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No archived widgets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onEdit={() => handleEditWidget(widget)}
                    onDelete={() => widget.id && handleDeleteWidget(widget.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface WidgetCardProps {
  widget: any;
  onEdit: () => void;
  onDelete: () => void;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ widget, onEdit, onDelete }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge>Active</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300";
      case "draft":
        return "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300";
      case "archived":
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${getIconColor(
              widget.status
            )}`}
          >
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{widget.name}</h3>
            <p className="text-sm text-muted-foreground">
              {widget.design?.headerText || "Chat Widget"}
            </p>
          </div>
        </div>
        {getStatusBadge(widget.status)}
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-muted-foreground">
            Provider: {widget.behavior?.aiProvider || "Not set"}
          </p>
          <p className="text-muted-foreground">
            Position: {widget.placement?.position || "Bottom Right"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={onEdit}
          >
            Edit <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WidgetList;
