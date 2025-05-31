import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, Save } from "lucide-react";

interface WidgetHeaderProps {
    widgetName: string;
    widgetDescription: string;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onSave: () => void;
    onCopyEmbedCode: () => void;
    saving: boolean;
    isLoading: boolean;
    isEditing: boolean;
    hasCurrentWidget: boolean;
}

export const WidgetHeader: React.FC<WidgetHeaderProps> = ({
    widgetName,
    widgetDescription,
    onNameChange,
    onDescriptionChange,
    onSave,
    onCopyEmbedCode,
    saving,
    isLoading,
    isEditing,
    hasCurrentWidget,
}) => {
    return (
        <div className="flex items-center justify-between p-6 border-b">
            <div className="flex-1 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="widget-name">Widget Name</Label>
                    <Input
                        id="widget-name"
                        value={widgetName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter widget name"
                        className="text-lg font-semibold"
                    />
                </div>
                <div className="mt-2 space-y-2">
                    <Label htmlFor="widget-description">Description (Optional)</Label>
                    <Input
                        id="widget-description"
                        value={widgetDescription}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Brief description of your widget"
                        className="text-sm text-muted-foreground"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={onCopyEmbedCode}
                    disabled={!hasCurrentWidget}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Embed Code
                </Button>
                <Button onClick={onSave} disabled={saving || isLoading}>
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing ? "Update Widget" : "Save Widget"}
                </Button>
            </div>
        </div>
    );
};

export default WidgetHeader; 