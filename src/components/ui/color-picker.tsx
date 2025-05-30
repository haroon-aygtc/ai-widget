import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ColorPicker({
  value = "#ffffff",
  onChange,
  className,
}: ColorPickerProps) {
  const [color, setColor] = React.useState<string>(value);

  React.useEffect(() => {
    setColor(value);
  }, [value]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onChange?.(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorChange(e.target.value);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-8 h-8 rounded-md border cursor-pointer overflow-hidden"
            style={{ backgroundColor: color }}
            aria-label="Pick a color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <div className="w-full h-24 rounded-md border overflow-hidden">
                <input
                  type="color"
                  value={color}
                  onChange={handleInputChange}
                  className="w-full h-full cursor-pointer border-0 m-0 p-0"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={color}
                  onChange={handleInputChange}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                "#000000",
                "#ffffff",
                "#f44336",
                "#e91e63",
                "#9c27b0",
                "#673ab7",
                "#3f51b5",
                "#2196f3",
                "#03a9f4",
                "#00bcd4",
                "#009688",
                "#4caf50",
                "#8bc34a",
                "#cddc39",
                "#ffeb3b",
                "#ffc107",
                "#ff9800",
                "#ff5722",
                "#795548",
                "#607d8b",
              ].map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className="w-full h-6 rounded-md border cursor-pointer"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={color}
        onChange={handleInputChange}
        className="w-24"
        placeholder="#ffffff"
      />
    </div>
  );
}
