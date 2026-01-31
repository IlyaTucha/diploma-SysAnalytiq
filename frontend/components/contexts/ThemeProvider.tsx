import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  getThemeColor: (lightColor: string, darkColor?: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorMappings: Record<string, { light: string; dark: string }> = {
  indigo: { light: '#4F46E5', dark: '#6366F1' },
  green: { light: '#10B981', dark: '#10B981' },
  orange: { light: '#F59E0B', dark: '#F59E0B' },
  purple: { light: '#8B5CF6', dark: '#8B5CF6' },
  blue: { light: '#0077FF', dark: '#3B82F6' },
  codeBackground: { light: '#1E293B', dark: '#1E293B' },
  warningBackground: { light: '#FEF3C7', dark: '#422006' },
  warningBorder: { light: '#F59E0B', dark: '#F59E0B' },
  indigoBackground: { light: '#E0E7FF', dark: '#312E81' },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getThemeColor = (lightColor: string, darkColor?: string) => {
    if (darkColor && theme === 'dark') {
      return darkColor;
    }
    
    for (const [_key, colors] of Object.entries(colorMappings)) {
      if (colors.light === lightColor) {
        return theme === 'dark' ? colors.dark : colors.light;
      }
    }
    
    return lightColor;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
