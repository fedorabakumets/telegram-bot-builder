/**
 * @fileoverview Аренда единственного исполнителя для одного идентификатора runner.
 * @module server/bots/runtime-lease
 */

import { randomUUID } from "node:crypto";

/** Соединение Redis с атомарными операциями аренды. */
export interface LeaseRedis {
  /** Создаёт ключ только при его отсутствии. */
  set(key: string, value: string, mode: "PX", ttl: number, condition: "NX"): Promise<string | null>;
  /** Выполняет атомарный сценарий проверки владельца. */
  eval(script: string, keyCount: number, ...args: string[]): Promise<unknown>;
}

/** Обновляет срок только владельцу ключа. */
const RENEW = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("PEXPIRE", KEYS[1], ARGV[2]) else return 0 end';
/** Удаляет ключ только владельцу ключа. */
const RELEASE = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';

/** Аренда процесса исполнителя. */
export interface RuntimeLease {
  /** Уникальный владелец текущей аренды. */
  owner: string;
  /** Продлевает аренду; false означает потерю владения. */
  renew(): Promise<boolean>;
  /** Освобождает аренду, если она ещё принадлежит процессу. */
  release(): Promise<void>;
}

/**
 * Захватывает аренду для одного runner ID.
 * @param redis - Соединение Redis
 * @param runnerId - Идентификатор исполнителя
 * @param ttlMs - Срок аренды в миллисекундах
 * @returns Аренда либо null, если её держит другой процесс
 */
export async function acquireRuntimeLease(redis: LeaseRedis, runnerId: string, ttlMs: number): Promise<RuntimeLease | null> {
  if (!runnerId || !Number.isSafeInteger(ttlMs) || ttlMs < 1_000) throw new Error("Некорректные параметры аренды исполнителя");
  const key = `tbb:runner:${runnerId}:lease`;
  const owner = randomUUID();
  const acquired = await redis.set(key, owner, "PX", ttlMs, "NX");
  if (acquired !== "OK") return null;
  return {
    owner,
    renew: async () => Number(await redis.eval(RENEW, 1, key, owner, String(ttlMs))) === 1,
    release: async () => { await redis.eval(RELEASE, 1, key, owner); },
  };
}

/**
 * Поддерживает аренду и сообщает о потере, включая ошибку Redis.
 * @param lease - Захваченная аренда
 * @param intervalMs - Интервал продления
 * @param onLost - Действие при потере аренды
 * @param deadlineMs - Предельное время без успешного продления
 * @returns Функция остановки таймера
 */
export function watchRuntimeLease(lease: RuntimeLease, intervalMs: number, onLost: (error?: unknown) => void, deadlineMs = intervalMs * 3): () => void {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1 || !Number.isSafeInteger(deadlineMs) || deadlineMs <= intervalMs) {
    throw new Error("Некорректный интервал аренды");
  }
  let stopped = false;
  let renewing = false;
  let lastRenewed = Date.now();
  const timer = setInterval(() => {
    if (stopped) return;
    if (Date.now() - lastRenewed >= deadlineMs) return lose(new Error("Срок продления аренды исполнителя истёк"));
    if (renewing) return;
    renewing = true;
    void lease.renew().then((owned) => {
      if (!owned && !stopped) lose();
      if (owned) lastRenewed = Date.now();
    }).catch((error) => {
      if (!stopped) lose(error);
    }).finally(() => { renewing = false; });
  }, intervalMs);
  /** Останавливает наблюдение после потери аренды. */
  function lose(error?: unknown): void {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    onLost(error);
  }
  return () => { stopped = true; clearInterval(timer); };
}
