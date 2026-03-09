/**
 * @fileoverview Типы для HTTP запросов с таймаутом
 * @module server/telegram/types/http-request.ts
 */

/**
 * Опции для HTTP запроса с таймаутом
 */
export interface HttpTimeoutOptions {
  /** URL для запроса */
  url: string;

  /** Таймаут запроса в миллисекундах (по умолчанию 30000) */
  timeout?: number;
}
