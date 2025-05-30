"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force theme to be applied on initial render
  React.useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme") || props.defaultTheme || "system";
    document.documentElement.classList.toggle(
      "dark",
      savedTheme === "dark" ||
        (savedTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, [props.defaultTheme]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
