/**
 * @fileoverview Хук для управления темой терминала
 *
 * Предоставляет классы стилей в зависимости от текущей темы.
 *
 * @module useTerminalTheme
 */

import { useTheme } from '@/components/theme-provider';

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
  const { theme } = useTheme();

  return {
    terminalBgClass: theme === 'dark' ? 'bg-black' : 'bg-gray-100',
    terminalTextClass: theme === 'dark' ? 'text-green-400' : 'text-green-800',
    headerBgClass: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300',
    buttonTextColorClass: theme === 'dark' ? 'text-white' : 'text-black',
    buttonHoverClass: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-400',
    placeholderTextClass: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
    stderrTextClass: theme === 'dark' ? 'text-red-400' : 'text-red-600'
  };
}
