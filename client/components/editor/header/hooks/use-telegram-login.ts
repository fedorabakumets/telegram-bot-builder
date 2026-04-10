/**
 * @fileoverview Хук открытия popup авторизации Telegram
 * @module components/editor/header/hooks/use-telegram-login
 */

/** Параметры окна авторизации */
const LOGIN_WINDOW_CONFIG = {
  width: 500,
  height: 600,
} as const;

/**
 * Хук для открытия popup-окна авторизации через Telegram.
 * Обработка ответа вынесена в {@link useTelegramAuthListener}.
 *
 * @returns Объект с функцией handleTelegramLogin
 */
export function useTelegramLogin() {
  /**
   * Открывает окно авторизации Telegram по центру экрана
   */
  const handleTelegramLogin = () => {
    const { width, height } = LOGIN_WINDOW_CONFIG;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      '/api/auth/login',
      'telegram_login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return { handleTelegramLogin };
}
