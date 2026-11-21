/** @fileoverview Подтверждение выхода локального процесса с устаревшими Telegram-клиентами. */
import type { WorkerChannel } from './workerChannel';

/**
 * Завершает воркер и ждёт событие выхода его процесса.
 * @param channel - Канал выделенного локального Python-процесса.
 * @param requestShutdown - Отправляет команду мягкого завершения.
 * @param timeoutMs - Бюджет ожидания одного этапа.
 * @returns Подтверждён ли фактический выход процесса.
 */
export function confirmCutoverWorkerExit(
  channel: WorkerChannel, requestShutdown: () => boolean, timeoutMs = 5_000,
): Promise<boolean> {
  return new Promise(resolve => {
    const deadline = setTimeout(() => finish(false), timeoutMs * 2);
    const force = setTimeout(() => channel.kill(), timeoutMs);

    /** Снимает временные таймеры и слушатель выхода. */
    function finish(exited: boolean): void {
      clearTimeout(deadline);
      clearTimeout(force);
      channel.off('exit', onExit);
      resolve(exited);
    }

    /** Получает отчёт от дочернего процесса. */
    function onExit(): void { finish(true); }

    channel.once('exit', onExit);
    if (!requestShutdown()) {
      clearTimeout(force);
      channel.kill();
    }
  });
}
