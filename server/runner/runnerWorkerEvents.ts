/**
 * @fileoverview Процесс воркера на исполнителе: пересылка его вывода панели, штатная
 * остановка и сообщения, которыми исполнитель отвечает за воркер (бот не запустился).
 * @module server/runner/runnerWorkerEvents
 */

import type { LocalWorkerChannel } from "../bots/localWorkerChannel";
import type { RunnerEvent } from "../redis/workerStreams";

/**
 * Пересылает вывод и завершение процесса воркера событиями
 * @param channel - Процесс воркера
 * @param base - Ключ воркера и ID экземпляра
 * @param emit - Отправка события панели
 * @param onGone - Вызывается, когда процесс завершился или не запустился
 */
export function forwardWorkerEvents(
  channel: LocalWorkerChannel,
  base: { w: string; i: string },
  emit: (event: RunnerEvent) => void,
  onGone: () => void,
): void {
  channel.on("line", (line: string) => emit({ ...base, k: "line", l: line }));
  channel.on("stderr", (text: string) => emit({ ...base, k: "stderr", l: text }));
  channel.on("exit", (code: number | null, signal: string | null) => {
    onGone();
    console.log(`🛰️ Воркер ${base.w} завершился: code=${code}, signal=${signal}`);
    emit({ ...base, k: "exit", c: code === null ? undefined : String(code), s: signal ?? undefined });
  });
  channel.on("error", (error: Error) => {
    onGone();
    console.error(`🛰️ Воркер ${base.w} не запустился: ${error.message}`);
    emit({ ...base, k: "error", l: error.message });
  });
}

/**
 * События «бот упал с ошибкой» в формате воркера: строка в лог бота и bot_exited
 * @param base - Ключ воркера и ID экземпляра
 * @param tokenId - ID токена
 * @param reason - Причина
 * @returns события для панели
 */
export function botFailedEvents(base: { w: string; i: string }, tokenId: number, reason: string): RunnerEvent[] {
  return [
    { ...base, k: "line", l: JSON.stringify({ type: "stderr", token_id: tokenId, content: reason }) },
    { ...base, k: "line", l: JSON.stringify({ type: "system", content: `bot_exited:${tokenId}:error` }) },
  ];
}

/**
 * Просит воркер завершиться (shutdown), по таймауту убивает
 * @param channel - Процесс воркера
 * @param graceMs - Сколько ждать штатного завершения
 * @returns промис после завершения процесса
 */
export function stopWorker(channel: LocalWorkerChannel, graceMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => channel.kill(), graceMs);
    channel.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    if (!channel.send(JSON.stringify({ cmd: "shutdown" }))) channel.kill();
  });
}
