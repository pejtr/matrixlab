import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorTheme = "purple" | "blue" | "green" | "orange";

export const COLOR_THEMES = {
  purple: {
    name: "Purple Dream",
    gradient: "from-purple-900 via-purple-800 to-indigo-900",
    accent: "pink-500",
    accentHover: "pink-600",
    secondary: "purple-500",
    secondaryHover: "purple-600",
  },
  blue: {
    name: "Ocean Blue",
    gradient: "from-blue-900 via-cyan-800 to-teal-900",
    accent: "cyan-400",
    accentHover: "cyan-500",
    secondary: "blue-500",
    secondaryHover: "blue-600",
  },
  green: {
    name: "Forest Green",
    gradient: "from-green-900 via-emerald-800 to-teal-900",
    accent: "emerald-400",
    accentHover: "emerald-500",
    secondary: "green-500",
    secondaryHover: "green-600",
  },
  orange: {
    name: "Sunset Orange",
    gradient: "from-orange-900 via-red-800 to-pink-900",
    accent: "orange-400",
    accentHover: "orange-500",
    secondary: "red-500",
    secondaryHover: "red-600",
  },
};

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  themeConfig: typeof COLOR_THEMES[ColorTheme];
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem("colorTheme");
    return (stored as ColorTheme) || "purple";
  });

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem("colorTheme", theme);
  };

  const themeConfig = COLOR_THEMES[colorTheme];

  useEffect(() => {
    // Apply theme to document root for global CSS variables
    document.documentElement.setAttribute("data-color-theme", colorTheme);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, themeConfig }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within ColorThemeProvider");
  }
  return context;
}
