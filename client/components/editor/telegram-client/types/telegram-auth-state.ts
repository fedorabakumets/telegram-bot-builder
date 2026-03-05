/**
 * @fileoverview Типы состояния для компонента TelegramAuth
 *
 * Определяет шаги авторизации и состояние QR-кода.
 *
 * @module TelegramAuthState
 */

/** Шаг авторизации: phone, qr, qr-password */
export type AuthStep = 'phone' | 'qr' | 'qr-password';

/**
 * Состояние QR-кода
 */
export interface QrState {
  /** Токен QR-кода */
  token: string;
  /** URL для генерации QR-кода */
  url: string;
  /** Пароль 2FA (если требуется) */
  password: string;
  /** Обратный отсчёт до обновления */
  countdown: number;
}
