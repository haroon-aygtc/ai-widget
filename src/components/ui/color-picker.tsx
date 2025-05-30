import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value || "#000000");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);
    onChange(newColor);
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => {
        inputRef.current?.click();
      }, 100);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 w-10 rounded-md border border-input",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            className
          )}
          style={{ backgroundColor: currentColor }}
          onClick={handleClick}
          disabled={disabled}
        >
          <span className="sr-only">Pick a color</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="h-8 w-full cursor-pointer appearance-none overflow-hidden rounded-md border border-input"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentColor}
              onChange={handleColorChange}
              className="h-8 w-full rounded-md border border-input px-3 py-1 text-sm"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
