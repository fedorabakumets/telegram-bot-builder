/**
 * @fileoverview Хук для входа через Telegram
 * @description Предоставляет функцию для открытия окна авторизации Telegram
 */

/** Параметры окна авторизации */
const LOGIN_WINDOW_CONFIG = {
  width: 500,
  height: 600,
} as const;

/**
 * Хук для управления входом через Telegram
 * @returns Объект с функцией handleTelegramLogin для открытия окна авторизации
 */
export function useTelegramLogin() {
  /**
   * Открывает окно авторизации Telegram в центре экрана
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
