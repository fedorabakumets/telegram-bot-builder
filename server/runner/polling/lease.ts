/** @fileoverview Общая с Python блокировка polling и остановка при потере владения. */
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import type Redis from "ioredis";
import { TelegramTokenUnauthorized } from "./telegramUnauthorized";
import { TelegramBotFrozen } from "./telegramFrozen";

/** Выполняет Redis-операцию с конечным ожиданием, не раскрывая параметры подключения. */
async function deadline<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Истекло ожидание блокировки polling")), 5_000);
    })]);
  } finally { clearTimeout(timer); }
}

/** Удерживает исключительную блокировку до завершения отменяемого получателя. */
export async function withPollingLease(redis: Pick<Redis, "set" | "eval">, token: string,
  signal: AbortSignal, receive: (signal: AbortSignal) => Promise<void>,
  beforeRelease?: () => Promise<void>): Promise<void> {
  if (signal.aborted) return;
  const key = `bot:lock:${token.slice(-10)}`, owner = randomUUID();
  const release = () => redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", 1, key, owner);
  const acquiring = redis.set(key, owner, "EX", 60, "NX");
  let acquired = false;
  try { acquired = (await deadline(acquiring)) === "OK"; }
  catch {
    void acquiring.then((value) => value === "OK" ? release() : undefined).catch(() => {});
    throw new Error("Не удалось захватить блокировку polling");
  }
  if (!acquired) throw new Error("Polling уже принадлежит другому обработчику");
  if (signal.aborted) { await deadline(release()).catch(() => {}); return; }
  const stopping = new AbortController();
  const combined = AbortSignal.any([signal, stopping.signal]);
  const renewal = (async () => {
    while (!combined.aborted) {
      await sleep(15_000, undefined, { signal: combined });
      const renewed = await deadline(redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('EXPIRE',KEYS[1],60) else return 0 end", 1, key, owner));
      if (renewed !== 1) throw new Error("Потеряна блокировка polling");
    }
  })();
  const receiving = Promise.resolve().then(() => receive(combined));
  try { await Promise.race([renewal, receiving]); }
  catch (error) {
    if (!signal.aborted && (error instanceof TelegramTokenUnauthorized || error instanceof TelegramBotFrozen)) throw error;
    if (!signal.aborted) throw error instanceof Error
      && /^(Потеряна блокировка polling|Telegram отклонил polling: код \d+)$/.test(error.message)
      ? error : new Error("Приём обновлений Telegram остановлен");
  }
  finally {
    stopping.abort();
    await Promise.allSettled([receiving, renewal]);
    await beforeRelease?.();
    await deadline(release()).catch(() => {});
  }
}
