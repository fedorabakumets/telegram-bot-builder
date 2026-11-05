/**
 * @fileoverview Межпроцессная координация отправок Telegram через Redis.
 */
import { createHash } from "crypto";
import { getRedisPublisher } from "../../../../redis/redisClient";

/** Атомарно выдаёт разрешение или сообщает время до повторной проверки. */
const ACQUIRE = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
local next = tonumber(redis.call('HGET', KEYS[1], 'next') or '0')
local blocked = tonumber(redis.call('HGET', KEYS[1], 'blocked') or '0')
local delay = math.max(next, blocked) - now
if delay > 0 then return delay end
redis.call('HSET', KEYS[1], 'next', now + tonumber(ARGV[1]))
redis.call('PEXPIRE', KEYS[1], math.max(60000, tonumber(ARGV[1]) + 1000))
return 0`;

/** Атомарно продлевает общую паузу бота после ответа Telegram 429. */
const PAUSE = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
local blocked = tonumber(redis.call('HGET', KEYS[1], 'blocked') or '0')
local untilTime = math.max(blocked, now + tonumber(ARGV[1]))
redis.call('HSET', KEYS[1], 'blocked', untilTime)
redis.call('PEXPIRE', KEYS[1], math.max(60000, untilTime - now + 1000))
return untilTime - now`;

/**
 * Создаёт ключ ограничителя без сохранения токена бота в Redis.
 * @param token - Токен бота
 * @returns Ключ Redis
 */
function keyFor(token: string): string {
  return `telegram-send-limit:${createHash("sha256").update(token).digest("hex")}`;
}

/**
 * Проверяет общую очередь бота в Redis.
 * @param token - Токен бота
 * @param interval - Занимаемый интервал в миллисекундах
 * @returns Задержка или null при недоступности Redis
 */
export async function acquireRedisTelegramSlot(token: string, interval: number): Promise<number | null> {
  const redis = getRedisPublisher();
  if (!redis || redis.status !== "ready") return null;
  try { return Number(await redis.eval(ACQUIRE, 1, keyFor(token), String(interval))); }
  catch { return null; }
}

/**
 * Передаёт паузу Telegram всем процессам сервера.
 * @param token - Токен бота
 * @param duration - Длительность паузы в миллисекундах
 * @returns Обещание завершения записи
 */
export async function pauseRedisTelegramMessages(token: string, duration: number): Promise<void> {
  const redis = getRedisPublisher();
  if (!redis || redis.status !== "ready") return;
  try { await redis.eval(PAUSE, 1, keyFor(token), String(duration)); }
  catch { /* Локальное ограничение продолжает действовать при сбое Redis. */ }
}
