/** @fileoverview Завершение регистрации после фатальной ошибки временного обработчика. */
import type { DispatchEntry, DispatcherDependencies } from "./dispatcherTypes";

/** Отменяет приём и публикует ошибку только после освобождения блокировки, не ожидая собственную задачу. */
export function failChildRegistration(entry: DispatchEntry, dependencies: DispatcherDependencies,
  remove: () => void, error?: unknown): void {
  if (entry.failed) return;
  entry.failed = true;
  entry.quiescing = true;
  entry.pending = false;
  entry.abort.abort();
  entry.childAbort.abort();
  if (entry.retry) clearTimeout(entry.retry);
  // Отказ по памяти передаётся один раз, но сбой журнала не мешает освобождению.
  if (error && typeof error === "object" && "code" in error && error.code === "memory_pressure") {
    try { dependencies.onError?.(entry.bot, error); } catch { /* Завершение регистрации обязательно. */ }
  }
  queueMicrotask(() => {
    void (async () => {
      await entry.receiver;
      remove();
      dependencies.lifecycle(entry.bot, "error");
    })();
  });
}
