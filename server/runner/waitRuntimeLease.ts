/** @fileoverview Ожидание свободной аренды при смене контейнеров исполнителя без запуска дубликата. */
import { setTimeout as delay } from 'node:timers/promises';
import { acquireRuntimeLease, type LeaseRedis, type RuntimeLease } from '../bots/runtime-lease';

/**
 * Отменяет ожидание Redis и освобождает аренду, если ответ пришёл уже после отмены.
 * @param redis - Отдельное соединение аренды.
 * @param runnerId - Идентификатор исполнителя.
 * @param signal - Сигнал завершения ожидания.
 * @returns Захваченная аренда либо отсутствие свободной аренды.
 */
function attempt(redis: LeaseRedis, runnerId: string, signal: AbortSignal): Promise<RuntimeLease | null> {
  return new Promise((resolve, reject) => {
    /** Прерывает зависшую операцию без удаления чужой блокировки. */
    const abort = () => reject(signal.reason);
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    void acquireRuntimeLease(redis, runnerId, 15_000).then((lease) => {
      signal.removeEventListener('abort', abort);
      if (signal.aborted) {
        void lease?.release().catch(() => undefined);
        reject(signal.reason);
      } else resolve(lease);
    }, (error: unknown) => {
      signal.removeEventListener('abort', abort);
      reject(error);
    });
  });
}

/**
 * Ждёт завершения предыдущего контейнера с ограниченным сроком и отменой по сигналу процесса.
 * @param redis - Соединение аренды; закрывается вызывающим процессом при завершении.
 * @param runnerId - Идентификатор единственного исполнителя.
 * @param signal - Сигнал остановки запуска.
 * @param timeoutMs - Предельное время ожидания смены контейнеров.
 * @returns Исключительная аренда; команды разрешены только после её получения.
 */
export async function waitRuntimeLease(redis: LeaseRedis, runnerId: string, signal: AbortSignal,
  timeoutMs = 120_000): Promise<RuntimeLease> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error('Некорректный срок ожидания аренды');
  const controller = new AbortController();
  /** Передаёт сигнал остановки процесса текущему ожиданию. */
  const abort = () => controller.abort(new Error('Запуск исполнителя отменён'));
  const timer = setTimeout(() => controller.abort(new Error('Истёк срок ожидания свободного исполнителя')), timeoutMs);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  let announced = false;
  try {
    while (true) {
      const lease = await attempt(redis, runnerId, controller.signal);
      if (lease) return lease;
      if (!announced) {
        console.log(`🛰️ Исполнитель ${runnerId}: ожидаем освобождения аренды предыдущим контейнером`);
        announced = true;
      }
      await delay(1000, undefined, { signal: controller.signal });
    }
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
