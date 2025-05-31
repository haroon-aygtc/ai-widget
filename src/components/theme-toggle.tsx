import { Moon, Sun, Laptop, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the theme toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist theme preference
  useEffect(() => {
    if (mounted && theme) {
      localStorage.setItem("theme-preference", theme);
      // Apply theme class to document root for comprehensive theming
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // Trigger a custom event for other components to listen to theme changes
    window.dispatchEvent(new CustomEvent("themeChange", { detail: newTheme }));
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 transition-all hover:scale-105"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className={`cursor-pointer ${theme === "light" ? "bg-accent text-accent-foreground" : ""}`}
        >
          <Sun className="h-4 w-4 mr-2" />
          <span>Light</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className={`cursor-pointer ${theme === "dark" ? "bg-accent text-accent-foreground" : ""}`}
        >
          <Moon className="h-4 w-4 mr-2" />
          <span>Dark</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className={`cursor-pointer ${theme === "system" ? "bg-accent text-accent-foreground" : ""}`}
        >
          <Laptop className="h-4 w-4 mr-2" />
          <span>System</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
