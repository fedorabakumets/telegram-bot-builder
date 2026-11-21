/** @fileoverview Защита переноса от устаревших команд запуска в очереди исполнителя. */
import { resolveBotRuntimeMode } from '../runtime/bot-runtime-mode';
import { storage } from '../storages/storage';
import { setBotDesiredStatus } from './setBotDesiredStatus';
import { getWorkerRuntime } from './workerRuntime';

/**
 * Делает уже отправленные команды запуска недействительными, сохраняя исходные намерения пользователя.
 * @param projectId - Проект с захваченным журналом переноса.
 * @param botIds - Боты переноса.
 * @returns Обновлена ли версия каждого существующего намерения.
 */
export async function fenceQueuedTelegramCutoverStarts(projectId: number, botIds: readonly number[]): Promise<boolean> {
  if (resolveBotRuntimeMode() !== 'api' && getWorkerRuntime() !== 'remote') return true;
  for (const botId of botIds) {
    const instance = await storage.getBotInstanceByToken(botId);
    if (!instance) continue;
    if (instance.projectId !== projectId) return false;
    const desired = instance.desiredStatus;
    /** Без намерения ранее выпущенная команда запуска не пройдёт проверку исполнителя. */
    if (desired == null) continue;
    if (desired !== 'running' && desired !== 'stopped') return false;
    const generation = await setBotDesiredStatus(instance.id, desired, instance.desiredGeneration);
    if (generation == null) return false;
  }
  return true;
}
