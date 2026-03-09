/**
 * @fileoverview Тип API credentials для Telegram Client API
 *
 * Используется для хранения настроек подключения к Telegram API.
 *
 * @module ApiCredentials
 */

/**
 * Учётные данные Telegram API
 */
export interface ApiCredentials {
  /** API ID приложения от my.telegram.org */
  apiId: string;
  /** API Hash приложения от my.telegram.org */
  apiHash: string;
}
