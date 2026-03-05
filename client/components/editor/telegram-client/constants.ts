/**
 * @fileoverview Константы модуля telegram-client
 *
 * Централизованное хранилище магических чисел и значений.
 *
 * @module constants
 */

/** Интервал обновления QR-токена (мс) */
export const QR_POLL_INTERVAL = 25000;

/** Время жизни QR-токена (сек) */
export const QR_TOKEN_EXPIRY = 30;

/** Уровень коррекции ошибок QR-кода */
export const QR_ERROR_CORRECTION = 'H' as const;

/** Размер QR-кода по умолчанию (px) */
export const QR_DEFAULT_SIZE = 200;

/** Таймаут запроса (мс) */
export const REQUEST_TIMEOUT = 5000;

/** Максимум попыток запроса */
export const MAX_RETRY_ATTEMPTS = 3;
