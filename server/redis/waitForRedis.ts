/**
 * @fileoverview Утилита ожидания готовности Redis с повторными попытками
 * @module server/redis/waitForRedis
 */

import { isRedisAvailable, getRedisSubscriber } from './redisClient';

/** Максимальное количество попыток подключения */
const MAX_ATTEMPTS = 10;

/** Интервал между попытками в миллисекундах */
const RETRY_INTERVAL_MS = 3000;

/**
 * Ожидает готовности Redis и вызывает callback при успехе.
 * Если Redis недоступен после MAX_ATTEMPTS попыток — вызывает onFail.
 * @param label - Метка для логов (например, '[RedisLogs]')
 * @param onReady - Callback при успешном подключении
 * @param onFail - Callback при исчерпании попыток (опционально)
 */
export function waitForRedis(
  label: string,
  onReady: () => void,
  onFail?: () => void
): void {
  let attempts = 0;

  const tryInit = () => {
    attempts++;
    if (!isRedisAvailable() || !getRedisSubscriber()) {
      if (attempts >= MAX_ATTEMPTS) {
        console.log(`${label} Redis недоступен после ${MAX_ATTEMPTS} попыток — подписка отключена`);
        onFail?.();
        return;
      }
      setTimeout(tryInit, RETRY_INTERVAL_MS);
      return;
    }
    onReady();
  };

  tryInit();
}
