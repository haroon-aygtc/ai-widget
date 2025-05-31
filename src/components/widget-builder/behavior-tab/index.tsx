import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
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
import { useNavigate } from "react-router-dom";
import { AIProvider } from "@/lib/store";

interface BehaviorConfig {
    welcomeMessage: string;
    initialMessage: string;
    typingIndicator: boolean;
    showTimestamp: boolean;
    autoResponse: boolean;
    responseDelay: number;
    maxMessages: number;
}

interface BehaviorTabProps {
    config: BehaviorConfig;
    onChange: (field: string, value: any) => void;
    selectedAIProvider: string;
    onAIProviderChange: (value: string) => void;
    providers: AIProvider[];
}

export const BehaviorTab: React.FC<BehaviorTabProps> = ({
    config,
    onChange,
    selectedAIProvider,
    onAIProviderChange,
    providers,
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
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
                            value={config.welcomeMessage}
                            onChange={(e) => onChange("welcomeMessage", e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Initial Message</Label>
                        <Textarea
                            value={config.initialMessage}
                            onChange={(e) => onChange("initialMessage", e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="typing-indicator">Show Typing Indicator</Label>
                            <Switch
                                id="typing-indicator"
                                checked={config.typingIndicator}
                                onCheckedChange={(checked) =>
                                    onChange("typingIndicator", checked)
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="show-timestamp">Show Message Timestamps</Label>
                            <Switch
                                id="show-timestamp"
                                checked={config.showTimestamp}
                                onCheckedChange={(checked) => onChange("showTimestamp", checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="auto-response">Auto Response</Label>
                            <Switch
                                id="auto-response"
                                checked={config.autoResponse}
                                onCheckedChange={(checked) => onChange("autoResponse", checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Response Delay ({config.responseDelay}ms)</Label>
                        </div>
                        <Slider
                            value={[config.responseDelay]}
                            min={0}
                            max={2000}
                            step={100}
                            onValueChange={(value) => onChange("responseDelay", value[0])}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Max Messages History</Label>
                        <Select
                            value={config.maxMessages.toString()}
                            onValueChange={(value) => onChange("maxMessages", parseInt(value))}
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
                    <CardDescription>Select your configured AI provider</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>AI Provider</Label>
                            <Select
                                value={selectedAIProvider}
                                onValueChange={onAIProviderChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select AI provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Provider</SelectItem>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider.id || provider.provider_type} value={provider.id || provider.provider_type}>
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
        </div>
    );
};

export default BehaviorTab;