/**
 * @fileoverview Хук для управления темой терминала
 *
 * Предоставляет классы стилей в зависимости от текущей темы.
 *
 * @module useTerminalTheme
 */

/**
 * Результат работы хука темы терминала
 */
interface UseTerminalThemeResult {
  terminalBgClass: string;
  terminalTextClass: string;
  headerBgClass: string;
  buttonTextColorClass: string;
  buttonHoverClass: string;
  placeholderTextClass: string;
  stderrTextClass: string;
}

/**
 * Хук для управления темой терминала
 * @returns Объект с классами стилей для темы
 */
export function useTerminalTheme(): UseTerminalThemeResult {
  // Терминал живёт в теме панели: цвет остаётся только у ANSI и ошибок
  return {
    terminalBgClass: 'bg-background',
    terminalTextClass: 'text-foreground/90',
    headerBgClass: 'bg-muted/20',
    buttonTextColorClass: 'text-muted-foreground',
    buttonHoverClass: 'hover:bg-muted/60',
    placeholderTextClass: 'text-muted-foreground/60',
    stderrTextClass: 'text-red-500 dark:text-red-400',
  };
}
