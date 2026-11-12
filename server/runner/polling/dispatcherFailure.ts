/** @fileoverview Завершение регистрации после фатальной ошибки временного обработчика. */
import type { DispatchEntry, DispatcherDependencies } from "./dispatcherTypes";

/** Отменяет приём и публикует ошибку только после освобождения блокировки, не ожидая собственную задачу. */
export function failChildRegistration(entry: DispatchEntry, dependencies: DispatcherDependencies,
  remove: () => void): void {
  if (entry.failed) return;
  entry.failed = true;
  entry.quiescing = true;
  entry.pending = false;
  entry.abort.abort();
  entry.childAbort.abort();
  if (entry.retry) clearTimeout(entry.retry);
  queueMicrotask(() => {
    void (async () => {
      await entry.receiver;
      remove();
      dependencies.lifecycle(entry.bot, "error");
    })();
  });
}
