/**
 * Enhanced Theme Hook
 * 
 * Integrates with the existing ThemeProvider while adding design system utilities.
 * Provides theme-aware utilities and CSS variable management.
 */

import { useTheme as useBaseTheme } from '../../components/theme-provider';
import { resolveTheme, applyTheme, themes, type Theme, type ThemeConfig } from '../themes';
import { useEffect, useMemo } from 'react';

export interface UseThemeReturn {
  // Base theme functionality
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Enhanced functionality
  resolvedTheme: Exclude<Theme, 'system'>;
  themeConfig: ThemeConfig;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  
  // Utility functions
  toggleTheme: () => void;
  applyThemeToRoot: () => void;
}

/**
 * Enhanced theme hook with design system integration
 */
export function useTheme(): UseThemeReturn {
  const { theme, setTheme } = useBaseTheme();
  
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);
  const themeConfig = useMemo(() => themes[resolvedTheme], [resolvedTheme]);
  
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystem = theme === 'system';
  
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };
  
  const applyThemeToRoot = () => {
    applyTheme(resolvedTheme);
  };
  
  // Apply theme CSS variables when theme changes
  useEffect(() => {
    applyThemeToRoot();
  }, [resolvedTheme]);
  
  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyThemeToRoot();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  return {
    theme,
    setTheme,
    resolvedTheme,
    themeConfig,
    isDark,
    isLight,
    isSystem,
    toggleTheme,
    applyThemeToRoot,
  };
}