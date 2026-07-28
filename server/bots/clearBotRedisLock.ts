/**
 * @fileoverview Удаление Redis distributed lock бота (`bot:lock:{token[-10]}`)
 * @module server/bots/clearBotRedisLock
 */

import { getRedisPublisher } from '../redis/redisClient';

/**
 * Строит ключ Redis lock по секрету токена Telegram
 * @param token - Полная строка токена бота
 * @returns Ключ вида bot:lock:XXXXXXXXXX
 */
export function buildBotRedisLockKey(token: string): string {
  return `bot:lock:${token.slice(-10)}`;
}

/**
 * Удаляет Redis lock бота, чтобы следующий старт не получил «уже запущен».
 * Безопасно при отсутствии Redis / ошибках сети — lock истечёт по TTL (~60с).
 * @param token - Полная строка токена бота (или null/undefined — no-op)
 * @param tokenId - ID токена для лога (опционально)
 * @returns true если del выполнен без исключения
 */
export async function clearBotRedisLock(
  token: string | null | undefined,
  tokenId?: number,
): Promise<boolean> {
  if (!token) return false;
  const pub = getRedisPublisher();
  if (!pub) return false;
  try {
    const lockKey = buildBotRedisLockKey(token);
    await pub.del(lockKey);
    if (tokenId !== undefined) {
      console.log(`🔓 Redis lock удалён сервером для токена ${tokenId}`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Удаляет Redis lock по tokenId через storage.getBotToken
 * @param getToken - Колбэк получения записи токена (token + id)
 * @param tokenId - ID токена
 * @returns true если ключ удалён
 */
export async function clearBotRedisLockByTokenId(
  getToken: (id: number) => Promise<{ token: string; id: number } | null | undefined>,
  tokenId: number,
): Promise<boolean> {
  const row = await getToken(tokenId);
  if (!row?.token) return false;
  return clearBotRedisLock(row.token, tokenId);
}
