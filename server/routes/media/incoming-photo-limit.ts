/** @fileoverview Настраиваемый предел частоты входящих фото с Redis и локальным резервом. */
import { getRedisPublisher } from '../../redis/redisClient';
const attempts = new Map<number, { started: number; count: number }>();
const WINDOW_SECONDS = 3600;
const DEFAULT_LIMIT = 3600;

/** Возвращает настроенный предел запросов в час.
 * @param env - Переменные окружения
 * @returns Положительное число запросов
 */
export function incomingPhotoRateLimit(env: NodeJS.ProcessEnv = process.env): number {
  const value = Number(env.INCOMING_MEDIA_RATE_PER_HOUR);
  return Number.isSafeInteger(value) && value > 0 && value <= 100000 ? value : DEFAULT_LIMIT;
}

/** Проверяет лимит проекта с атомарным счётчиком Redis; при его сбое используется локальный счётчик.
 * @param projectId - Идентификатор проекта
 * @param now - Время для локального счётчика
 * @returns Время до повтора в секундах либо ноль
 */
export async function incomingPhotoRetryAfter(projectId: number, now = Date.now()): Promise<number> {
  const limit = incomingPhotoRateLimit();
  const redis = getRedisPublisher();
  if (redis) {
    try {
      const result = await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; local t=redis.call('TTL',KEYS[1]); if n>tonumber(ARGV[2]) then return t end; return 0", 1, `incoming-photo-rate:${projectId}`, String(WINDOW_SECONDS), String(limit));
      return Math.max(0, Number(result) || 0);
    } catch { /* При сбое Redis сохраняем локальную защиту. */ }
  }
  for (const [id, entry] of attempts) if (now - entry.started >= WINDOW_SECONDS * 1000) attempts.delete(id);
  const current = attempts.get(projectId);
  if (!current) { attempts.set(projectId, { started: now, count: 1 }); return 0; }
  if (current.count >= limit) return Math.max(1, Math.ceil((current.started + WINDOW_SECONDS * 1000 - now) / 1000));
  current.count++;
  return 0;
}
