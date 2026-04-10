/**
 * @fileoverview Хук-заглушка для обратной совместимости
 * @module components/editor/header/hooks/use-telegram-auth-listener
 *
 * Listener авторизации перенесён в {@link useTelegramLogin}.
 * Popup-механизм заменён на встроенный Telegram Login виджет.
 */

/**
 * Хук оставлен для обратной совместимости.
 * Логика postMessage listener перенесена в useTelegramLogin.
 */
export function useTelegramAuthListener(): void {
  // Listener перенесён в use-telegram-login.ts (Telegram.Login.init callback)
}
