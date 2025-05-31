import React from "react";
import { Button } from "@/components/ui/button";
import { Code, Copy } from "lucide-react";
import WidgetPreview from "@/components/dashboard/WidgetPreview";
import { WidgetConfig } from "@/lib/store";

interface WidgetPreviewPanelProps {
    config: WidgetConfig;
    onCopyEmbedCode: () => void;
    hasCurrentWidget: boolean;
}

export const WidgetPreviewPanel: React.FC<WidgetPreviewPanelProps> = ({
    config,
    onCopyEmbedCode,
    hasCurrentWidget,
}) => {
    return (
        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l p-4 sm:p-6 bg-muted/20">
            <div className="sticky top-6">
                <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                <div className="bg-background rounded-lg border shadow-sm p-4 h-[600px] overflow-hidden">
                    <WidgetPreview config={config} />
                </div>
                <div className="mt-4 space-y-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onCopyEmbedCode}
                        disabled={!hasCurrentWidget}
                    >
                        <Code className="mr-2 h-4 w-4" />
                        Copy Embed Code
                    </Button>
                    {!hasCurrentWidget && (
                        <p className="text-xs text-muted-foreground text-center">
                            Save widget first to get embed code
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WidgetPreviewPanel; 