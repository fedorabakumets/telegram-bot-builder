/** @fileoverview Отзывает ключ предыдущего локального запуска до подготовки нового окружения. */
import { storage } from '../storages/storage';
import { resolveBotRuntimeMode } from '../runtime/bot-runtime-mode';
import { getWorkerRuntime } from './workerRuntime';
import { setBotDesiredStatus } from './setBotDesiredStatus';

/**
 * Выделяет поколение локального общего клиента; удалённое намерение уже версионировано вызывающей стороной.
 * @param projectId - Проект запуска.
 * @param tokenId - Идентификатор токена.
 * @param token - Токен для создания первой записи экземпляра.
 * @returns Завершение фиксации поколения до выпуска ключа.
 */
export async function prepareLocalTelegramRunnerGeneration(projectId: number, tokenId: number, token: string): Promise<void> {
  if (resolveBotRuntimeMode() === 'api' || getWorkerRuntime() === 'remote'
    || process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED !== '1') return;
  const { getProjectTelegramAccountIdForBot } = await import('../database/project-telegram-accounts-store');
  if (await getProjectTelegramAccountIdForBot(projectId, tokenId) == null) return;
  const instance = await storage.getBotInstanceByToken(tokenId);
  if (instance) {
    const generation = await setBotDesiredStatus(instance.id, 'running', instance.desiredGeneration);
    if (generation == null) throw new Error('Локальный запуск отменён более новым намерением');
    return;
  }
  await storage.createBotInstance({
    projectId, tokenId, token, status: 'stopped', desiredStatus: 'running',
    desiredGeneration: 1, desiredUpdatedAt: new Date(),
  });
}
