/**
 * @fileoverview Очередь операций одного ключа воркера.
 * При изоляции параллельный запуск нескольких проектов в общий контейнер
 * пересоздаёт его по очереди, с полным списком проектов этого воркера.
 * @module server/bots/workerKeyLock
 */

/** Хвост очереди по ключу воркера */
const tails = new Map<number, Promise<unknown>>();

/**
 * Выполняет операции одного воркера строго по очереди
 * @param workerKey - Ключ воркера
 * @param fn - Операция
 * @returns результат операции
 */
export function withWorkerKeyLock<T>(workerKey: number, fn: () => Promise<T>): Promise<T> {
  const prev = tails.get(workerKey) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => gate);
  tails.set(workerKey, chained);
  return prev.catch(() => undefined).then(async () => {
    try {
      return await fn();
    } finally {
      release();
      if (tails.get(workerKey) === chained) tails.delete(workerKey);
    }
  });
}
