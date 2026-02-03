import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Тип темы оформления
 * @typedef {"light" | "dark" | "system"} Theme
 */
type Theme = "light" | "dark" | "system";

/**
 * Свойства провайдера темы
 * @interface ThemeProviderProps
 * @property {React.ReactNode} children - Дочерние элементы компонента
 * @property {Theme} [defaultTheme="system"] - Тема по умолчанию
 * @property {string} [storageKey="telegram-bot-builder-theme"] - Ключ для хранения темы в localStorage
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * Состояние провайдера темы
 * @interface ThemeProviderState
 * @property {Theme} theme - Текущая тема
 * @property {Function} setTheme - Функция для установки темы
 */
interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Провайдер темы оформления
 *
 * Компонент, который предоставляет контекст темы для всего приложения.
 * Позволяет управлять темой (светлая, темная, системная) и сохранять
 * выбранный вариант в localStorage.
 *
 * @param {ThemeProviderProps} props - Свойства компонента
 * @returns {JSX.Element} Провайдер контекста темы
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="dark">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "telegram-bot-builder-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Хук для использования темы оформления
 *
 * Позволяет получить текущую тему и функцию для её изменения
 * в любом компоненте, находящемся внутри ThemeProvider.
 *
 * @returns {ThemeProviderState} Объект с текущей темой и функцией для её изменения
 *
 * @throws {Error} Если хук используется вне ThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 *
 * const toggleTheme = () => {
 *   setTheme(theme === 'dark' ? 'light' : 'dark');
 * };
 * ```
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme должен использоваться внутри ThemeProvider");

  return context;
};