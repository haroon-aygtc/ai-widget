import { Moon, Sun, Laptop, Palette, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
      <Button variant="ghost" size="icon" className="relative overflow-hidden">
        <div className="h-[1.2rem] w-[1.2rem] animate-pulse bg-muted rounded-full" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);

    // Add a subtle animation effect
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
      }, 200);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />;
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400" />;
      default:
        return <Monitor className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95"
          data-theme-toggle
        >
          <div className="relative flex items-center justify-center">
            {/* Light mode icon */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 text-amber-500 dark:-rotate-90 dark:scale-0 absolute" />

            {/* Dark mode icon */}
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 text-blue-400 dark:rotate-0 dark:scale-100 absolute" />

            {/* System mode indicator */}
            {theme === 'system' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Monitor className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Active theme indicator */}
          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full opacity-60" />

          <span className="sr-only">Toggle theme - Current: {getThemeLabel()}</span>
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
          className={`flex items-center justify-between cursor-pointer ${theme === "light" ? "bg-accent" : ""
            }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className={`flex items-center justify-between cursor-pointer ${theme === "dark" ? "bg-accent" : ""
            }`}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-blue-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className={`flex items-center justify-between cursor-pointer ${theme === "system" ? "bg-accent" : ""
            }`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span>System</span>
          </div>
          {theme === "system" && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {theme === 'system'
            ? 'Follows your system preference'
            : `Using ${getThemeLabel().toLowerCase()} theme`
          }
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
