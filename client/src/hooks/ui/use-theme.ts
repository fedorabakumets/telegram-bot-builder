import { useTheme as useThemeProvider } from '@/components/theme-provider';
import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}

/**
 * Enhanced theme hook that provides additional theme utilities
 * Integrates with the existing ThemeProvider and adds system theme detection
 */
export function useTheme() {
  const { theme, setTheme } = useThemeProvider();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate resolved theme
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Theme utilities
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystem = theme === 'system';

  // Toggle between light and dark (preserves system if currently system)
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If system, switch to opposite of current system theme
      setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If explicit theme, toggle it
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, systemTheme, setTheme]);

  // Cycle through all themes: light -> dark -> system
  const cycleTheme = useCallback(() => {
    switch (theme) {
      case 'light':
        setTheme('dark');
        break;
      case 'dark':
        setTheme('system');
        break;
      case 'system':
        setTheme('light');
        break;
    }
  }, [theme, setTheme]);

  // Set specific theme with validation
  const setThemeWithValidation = useCallback((newTheme: Theme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    } else {
      console.warn(`Invalid theme: ${newTheme}. Using 'system' instead.`);
      setTheme('system');
    }
  }, [setTheme]);

  return {
    // Current theme state
    theme,
    resolvedTheme,
    systemTheme,
    
    // Theme flags
    isDark,
    isLight,
    isSystem,
    
    // Theme actions
    setTheme: setThemeWithValidation,
    toggleTheme,
    cycleTheme,
  };
}

/**
 * Hook for theme-aware CSS classes
 */
export function useThemeClasses() {
  const { resolvedTheme, isDark, isLight } = useTheme();

  const getThemeClass = useCallback((lightClass: string, darkClass: string) => {
    return isDark ? darkClass : lightClass;
  }, [isDark]);

  const getConditionalClass = useCallback((condition: boolean, trueClass: string, falseClass: string = '') => {
    return condition ? trueClass : falseClass;
  }, []);

  return {
    resolvedTheme,
    isDark,
    isLight,
    getThemeClass,
    getConditionalClass,
    
    // Common theme-aware classes
    classes: {
      background: getThemeClass('bg-white', 'bg-gray-900'),
      foreground: getThemeClass('text-gray-900', 'text-gray-100'),
      muted: getThemeClass('text-gray-600', 'text-gray-400'),
      border: getThemeClass('border-gray-200', 'border-gray-700'),
      card: getThemeClass('bg-white border-gray-200', 'bg-gray-800 border-gray-700'),
      input: getThemeClass('bg-white border-gray-300', 'bg-gray-800 border-gray-600'),
      button: {
        primary: getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-500'),
        secondary: getThemeClass('bg-gray-100 text-gray-900 hover:bg-gray-200', 'bg-gray-700 text-gray-100 hover:bg-gray-600'),
        ghost: getThemeClass('text-gray-700 hover:bg-gray-100', 'text-gray-300 hover:bg-gray-800'),
      },
    },
  };
}

/**
 * Hook for theme persistence and synchronization
 */
export function useThemeSync() {
  const { theme, setTheme } = useTheme();

  // Sync theme with user preferences (if user is authenticated)
  const syncWithUserPreferences = useCallback(async (userTheme?: Theme) => {
    if (userTheme && userTheme !== theme) {
      setTheme(userTheme);
    }
  }, [theme, setTheme]);

  // Save theme to user preferences (if user is authenticated)
  const saveToUserPreferences = useCallback(async (newTheme: Theme) => {
    try {
      // This would integrate with the user settings API
      // await updateUserSettings({ theme: newTheme });
      setTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme to user preferences:', error);
      // Fallback to local storage only
      setTheme(newTheme);
    }
  }, [setTheme]);

  return {
    theme,
    syncWithUserPreferences,
    saveToUserPreferences,
  };
}