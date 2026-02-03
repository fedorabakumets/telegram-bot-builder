import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

/**
 * Компонент переключения темы оформления
 *
 * Предоставляет кнопку для переключения между светлой и темной темами.
 * При клике на кнопку происходит изменение темы оформления приложения.
 *
 * @component
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @returns {JSX.Element} Кнопка с иконками солнца и луны для переключения темы
 */
export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  /**
   * Функция для переключения темы оформления
   *
   * Если текущая тема темная, то устанавливается светлая тема,
   * иначе устанавливается темная тема.
   */
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative overflow-hidden"
      onClick={toggleTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
}