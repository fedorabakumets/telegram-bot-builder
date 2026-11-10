/** @fileoverview Ограничение перебора административного ключа с ограниченным TTL-хранилищем. */
import type { Request, RequestHandler } from 'express';
import { isIP } from 'node:net';

/** Счётчик попыток одного адреса или подсети. */
interface Bucket {
  /** Количество принятых попыток. */
  count: number;
  /** Момент окончания окна в миллисекундах. */
  expiresAt: number;
}

/** Параметры защиты; значения по умолчанию подходят для редкого входа администратора. */
interface Options {
  /** Число попыток за окно. */
  max?: number;
  /** Продолжительность окна в миллисекундах. */
  windowMs?: number;
  /** Максимум адресов в памяти; активные записи не вытесняются. */
  capacity?: number;
  /** Источник времени для детерминированных тестов. */
  now?: () => number;
}

/** Нормализует доверенный Express IP; IPv6 объединяется по /64 против смены адресов.
 * @param req - Запрос после настройки доверенных прокси Express.
 * @returns Ключ адреса; сырые заголовки пересылки не используются.
 */
export function adminLoginIpKey(req: Pick<Request, 'ip' | 'socket'>): string {
  const ip = req.ip || req.socket.remoteAddress || '';
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return 'unknown';
  const canonical = new URL(`http://[${ip.split('%')[0]}]/`).hostname.slice(1, -1);
  const halves = canonical.split('::');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const parts = halves.length === 1 ? left : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
  const words = parts.map(part => Number.parseInt(part, 16));
  if (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff) {
    return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join('.');
  }
  return `${parts.slice(0, 4).join(':')}/64`;
}

/** Создаёт независимый лимитер: десять попыток за десять минут, максимум 10000 записей.
 * При заполнении отклоняет новые адреса, сохраняя защиту уже известных адресов.
 * @param options - Параметры окна и хранилища.
 * @returns Middleware с ответом 429 и временем следующей попытки.
 */
export function createAdminLoginRateLimit(options: Options = {}): RequestHandler {
  const { max = 10, windowMs = 600_000, capacity = 10_000, now = Date.now } = options;
  if (!Number.isInteger(max) || max < 1 || !Number.isFinite(windowMs) || windowMs < 1
    || !Number.isInteger(capacity) || capacity < 1) throw new Error('Некорректные параметры лимита входа');
  const buckets = new Map<string, Bucket>();
  let cleanupAt = 0;
  return (req, res, next) => {
    const time = now();
    if (time >= cleanupAt) {
      for (const [key, bucket] of buckets) if (bucket.expiresAt <= time) buckets.delete(key);
      cleanupAt = time + Math.min(windowMs, 60_000);
    }
    const key = adminLoginIpKey(req);
    let bucket = buckets.get(key);
    if (bucket && bucket.expiresAt <= time) { buckets.delete(key); bucket = undefined; }
    if (!bucket && buckets.size < capacity) {
      bucket = { count: 0, expiresAt: time + windowMs };
      buckets.set(key, bucket);
    }
    if (!bucket || bucket.count >= max) {
      let retryAt = bucket?.expiresAt ?? time + windowMs;
      if (!bucket) for (const value of buckets.values()) retryAt = Math.min(retryAt, value.expiresAt);
      res.set('Retry-After', String(Math.max(1, Math.ceil((retryAt - time) / 1000))));
      res.status(429).json({ error: 'Слишком много попыток входа. Повторите позже.' });
      return;
    }
    bucket.count++;
    next();
  };
}

/** Единый экземпляр защищает все запросы к административному входу этого процесса. */
export const adminLoginRateLimit = createAdminLoginRateLimit();
