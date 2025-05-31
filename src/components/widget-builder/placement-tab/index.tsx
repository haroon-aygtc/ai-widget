import React from "react";
import { Input } from "@/components/ui/input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface PlacementConfig {
    position: string;
    offsetX: number;
    offsetY: number;
    mobilePosition: string;
    showOnPages: string;
    excludePages: string;
    triggerType: string;
    triggerText: string;
}

interface PlacementTabProps {
    config: PlacementConfig;
    onChange: (field: string, value: any) => void;
}

export const PlacementTab: React.FC<PlacementTabProps> = ({
    config,
    onChange,
}) => {
    return (
        <div className="space-y-4">
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
                                value={config.position}
                                onValueChange={(value) => onChange("position", value)}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="flex items-center space-x-2 border rounded-md p-3">
                                    <RadioGroupItem value="bottom-right" id="bottom-right" />
                                    <Label htmlFor="bottom-right">Bottom Right</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-md p-3">
                                    <RadioGroupItem value="bottom-left" id="bottom-left" />
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
                                <Label>Horizontal Offset ({config.offsetX}px)</Label>
                                <Slider
                                    value={[config.offsetX]}
                                    min={0}
                                    max={50}
                                    step={1}
                                    onValueChange={(value) => onChange("offsetX", value[0])}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vertical Offset ({config.offsetY}px)</Label>
                                <Slider
                                    value={[config.offsetY]}
                                    min={0}
                                    max={50}
                                    step={1}
                                    onValueChange={(value) => onChange("offsetY", value[0])}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Mobile Position</Label>
                            <Select
                                value={config.mobilePosition}
                                onValueChange={(value) => onChange("mobilePosition", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bottom">Bottom Full Width</SelectItem>
                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
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
                                value={config.showOnPages}
                                onValueChange={(value) => onChange("showOnPages", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select pages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Pages</SelectItem>
                                    <SelectItem value="specific">Specific Pages</SelectItem>
                                    <SelectItem value="homepage">Homepage Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {config.showOnPages === "specific" && (
                            <div className="space-y-2">
                                <Label>Page URLs (one per line)</Label>
                                <Textarea placeholder="/about\n/contact\n/products/*" rows={3} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Exclude Pages (one per line)</Label>
                            <Textarea
                                value={config.excludePages}
                                onChange={(e) => onChange("excludePages", e.target.value)}
                                placeholder="/checkout\n/account/*\n/admin/*"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Widget Trigger Type</Label>
                            <Select
                                value={config.triggerType}
                                onValueChange={(value) => onChange("triggerType", value)}
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

                        {config.triggerType !== "auto" && (
                            <div className="space-y-2">
                                <Label>Trigger Text</Label>
                                <Input
                                    value={config.triggerText}
                                    onChange={(e) => onChange("triggerText", e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlacementTab; 