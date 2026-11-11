/** @fileoverview Атомарные квоты Redis с коротким ожиданием и защитой от зависших команд. */
import type { IncrementResponse } from 'express-rate-limit';
import { getRedisPublisher } from '../../redis/redisClient';

/** Устанавливает TTL в той же атомарной операции, что и увеличение счётчика. */
const INCREMENT = `
local hits = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end
return {hits, ttl}`;
/** Время следующей попытки после отказа Redis. */
let retryAt = 0;
/** Число незавершённых команд ограничивает ресурсы при зависании Redis. */
let pending = 0;

/** Учитывает запрос в общей квоте; при отказе вызывающий код использует локальную копию.
 * @param key - Ключ с пространством имён.
 * @param windowMs - Продолжительность окна.
 * @returns Общий счётчик либо null при недоступности Redis.
 */
export async function incrementUsersRedisLimit(key: string, windowMs: number): Promise<IncrementResponse | null> {
  const redis = getRedisPublisher();
  if (!redis || redis.status !== 'ready' || Date.now() < retryAt || pending >= 32) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  pending++;
  try {
    const command = Promise.resolve().then(() => redis.eval(INCREMENT, 1, key, String(windowMs)))
      .finally(() => { pending--; });
    const result = await Promise.race([
      command,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Превышено ожидание Redis')), 150);
      }),
    ]);
    if (!Array.isArray(result) || result.length !== 2
      || !Number.isSafeInteger(Number(result[0])) || Number(result[0]) < 1
      || !Number.isFinite(Number(result[1])) || Number(result[1]) < 0) {
      throw new Error('Некорректный ответ счётчика Redis');
    }
    return { totalHits: Number(result[0]), resetTime: new Date(Date.now() + Number(result[1])) };
  } catch {
    retryAt = Date.now() + 5000;
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
