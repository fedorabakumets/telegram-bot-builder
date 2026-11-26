/** @fileoverview Допуск запуска из общей очереди с проверкой отмены после ожидания. */
import { botStartupLimiter } from './botStartupLimiter';
import { getBotStartRevision } from './botStartState';
import { isServerShuttingDown } from './serverShutdownState';

/**
 * Ожидать место до захвата блокировок БД и отказаться от отменённого запуска.
 * @param projectId - Проект для ограничения одновременных запусков.
 * @param tokenId - Токен с сохранённой версией намерения.
 * @param revision - Версия намерения до постановки в очередь.
 * @returns Освобождение места для finally либо отсутствие допуска после отмены.
 */
export async function acquireBotStartupSlot(projectId: number, tokenId: number, revision: number): Promise<(() => void) | undefined> {
  const release = await botStartupLimiter.acquire(projectId);
  if (isServerShuttingDown() || getBotStartRevision(tokenId) !== revision) {
    release();
    return undefined;
  }
  return release;
}
