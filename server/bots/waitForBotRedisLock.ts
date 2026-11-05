/** @fileoverview Ожидание освобождения Redis-блокировки перед восстановлением бота. */
import { getRedisPublisher } from '../redis/redisClient';
import { buildBotRedisLockKey } from './clearBotRedisLock';
/** Сообщение об уже занятой блокировке токена. */
export const BOT_LOCK_BUSY_ERROR = 'Блокировка токена занята другим экземпляром бота';

/** Зависимости ожидания блокировки. */
export interface LockWaitDeps {
  /** Проверяет наличие блокировки. */
  exists: (key: string) => Promise<number>;
  /** Ожидает указанное число миллисекунд. */
  wait: (ms: number) => Promise<void>;
  /** Максимальное число проверок. */
  checks?: number;
}

/**
 * Ждёт истечения оставшейся блокировки без вмешательства в работу её владельца.
 * @param token - Токен Telegram-бота.
 * @param deps - Зависимости для проверки и ожидания.
 * @param waitForExpiry - Ожидать ли истечения блокировки.
 * @param isCancelled - Проверяет отмену ожидающего запуска.
 * @returns true при свободной блокировке или отсутствии Redis, иначе false.
 */
export async function waitForBotRedisLock(token: string, deps?: LockWaitDeps, waitForExpiry = true, isCancelled = () => false): Promise<boolean> {
  const redis = deps ? null : getRedisPublisher();
  if (!deps && !redis) return true;
  const exists = deps?.exists ?? ((key: string) => redis!.exists(key));
  const wait = deps?.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const checks = deps?.checks ?? (waitForExpiry ? 66 : 1);
  try {
    for (let i = 0; i < checks; i++) {
      if (isCancelled()) return false;
      if (!(await exists(buildBotRedisLockKey(token)))) return true;
      if (i + 1 < checks) await wait(1000);
    }
    return false;
  } catch {
    // Недоступный Redis не должен навсегда блокировать восстановление.
    return true;
  }
}
