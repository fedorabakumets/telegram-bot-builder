/**
 * @fileoverview Компонент автоматической регистрации терминалов
 *
 * Невидимый компонент, который вызывает хук useTerminalAutoRegister
 * на уровне приложения для регистрации терминалов запущенных ботов.
 *
 * @module bot/hooks/TerminalAutoRegister
 */

import { useTerminalAutoRegister } from './use-terminal-auto-register';

/**
 * Невидимый компонент для автоматической регистрации терминалов
 * @returns null
 */
export function TerminalAutoRegister(): null {
  useTerminalAutoRegister();
  return null;
}
