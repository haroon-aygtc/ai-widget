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
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";

interface DesignConfig {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
    headerText: string;
    buttonText: string;
    placeholderText: string;
}

interface DesignTabProps {
    config: DesignConfig;
    onChange: (field: string, value: any) => void;
}

export const DesignTab: React.FC<DesignTabProps> = ({ config, onChange }) => {
    return (
        <div className="space-y-4">
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
                                value={config.primaryColor}
                                onChange={(value) => onChange("primaryColor", value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <ColorPicker
                                value={config.secondaryColor}
                                onChange={(value) => onChange("secondaryColor", value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <ColorPicker
                                value={config.textColor}
                                onChange={(value) => onChange("textColor", value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select
                                value={config.fontFamily}
                                onValueChange={(value) => onChange("fontFamily", value)}
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
                            <Label>Font Size ({config.fontSize}px)</Label>
                        </div>
                        <Slider
                            value={[config.fontSize]}
                            min={10}
                            max={20}
                            step={1}
                            onValueChange={(value) => onChange("fontSize", value[0])}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Border Radius ({config.borderRadius}px)</Label>
                        </div>
                        <Slider
                            value={[config.borderRadius]}
                            min={0}
                            max={20}
                            step={1}
                            onValueChange={(value) => onChange("borderRadius", value[0])}
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
                            value={config.headerText}
                            onChange={(e) => onChange("headerText", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Button Text</Label>
                        <Input
                            value={config.buttonText}
                            onChange={(e) => onChange("buttonText", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Placeholder Text</Label>
                        <Input
                            value={config.placeholderText}
                            onChange={(e) => onChange("placeholderText", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DesignTab; 