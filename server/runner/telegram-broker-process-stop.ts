/** @fileoverview Ограниченное завершение собственного брокера после остановки потребителей. */
import type { ChildProcess } from 'node:child_process';
import type { TelegramBrokerProcessOptions } from './telegram-broker-process-types';

/**
 * Ожидает завершение, снимая таймер после быстрого штатного закрытия.
 * @param finished - Подтверждение завершения дочернего процесса.
 * @param milliseconds - Бюджет текущего этапа.
 * @returns Успел ли процесс завершиться.
 */
async function waitForExit(finished: Promise<void>, milliseconds: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      finished.then(() => true), new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), milliseconds); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

/**
 * Отправляет штатную команду aiohttp, затем ограниченно усиливает завершение.
 * @param child - Только дочерний процесс данного исполнителя.
 * @param finished - Подтверждение завершения процесса.
 * @param hasExited - Проверка уже полученного события завершения.
 * @param options - Бюджеты этапов завершения.
 */
export async function stopTelegramBrokerProcess(
  child: ChildProcess, finished: Promise<void>, hasExited: () => boolean, options: TelegramBrokerProcessOptions,
): Promise<void> {
  if (hasExited()) return;
  if (child.stdin?.writable && !child.stdin.destroyed) child.stdin.end('shutdown\n');
  if (await waitForExit(finished, options.shutdownTimeoutMs ?? 70_000)) return;
  child.kill('SIGTERM');
  if (!await waitForExit(finished, options.terminateTimeoutMs ?? 10_000)) {
    child.kill('SIGKILL');
    await waitForExit(finished, options.killTimeoutMs ?? 5_000);
  }
  throw new Error('Встроенный брокер потребовал принудительного завершения; штатное закрытие сессий не подтверждено');
}
