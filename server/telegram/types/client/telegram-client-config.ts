/**
 * @fileoverview Конфигурация клиента Telegram
 * @module server/telegram/types/client/telegram-client-config
 */

/**
 * Конфигурация для создания клиента Telegram
 */
export interface TelegramClientConfig {
  /** API ID приложения Telegram */
  apiId: string;

  /** API Hash приложения Telegram */
  apiHash: string;

  /** Строка сессии (опционально) */
  session?: string;

  /** Номер телефона пользователя (опционально) */
  phoneNumber?: string;
}
