/**
 * @fileoverview Фоновая очередь массовой проверки доступов с throttle и отменой.
 * @module server/routes/dialogs/chat-access-check-queue
 */
import { broadcastProjectEvent } from '../../terminal/broadcastProjectEvent';
import {
  toChatAccessCheckProgressPayload,
  type ChatAccessCheckJobView,
  type ChatAccessCheckStatus,
} from '@shared/project-sync/project-event';
import { persistChatAccessOutcome, probePrivateChatAccess } from './check-chat-access-core';
import type { ChatAccessProbe } from './check-chat-access-classify';
import {
  getChatAccessCheckJobUnscoped,
  updateChatAccessCheckJob,
} from './chat-access-check-job-store';
import { listPrivateUserIds } from './chat-access-check-audience';

/** Пауза между запросами: около 20 проверок в секунду. */
const DELAY_MS = 50;
/** Сколько раз повторять один чат при 429. */
const RETRY_LIMIT = 4;

/** jobId → флаг остановки, читается отменой. */
export const activeChatAccessChecks = new Map<number, 'running' | 'stopped'>();

/**
 * Пауза между запросами к Telegram.
 * @param ms - Миллисекунды
 * @returns Promise таймера
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Публикует безопасный прогресс в WebSocket проекта.
 * @param job - Текущие счётчики
 * @returns Завершение публикации
 */
export async function publishChatAccessCheckProgress(job: ChatAccessCheckJobView): Promise<void> {
  const data = toChatAccessCheckProgressPayload(job);
  await broadcastProjectEvent(job.projectId, {
    type: 'chat-access-check-progress',
    projectId: job.projectId,
    tokenId: job.tokenId,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Проверяет один чат с повтором 429. unauthorized — токен мёртв.
 * @param botToken - Токен бота
 * @param job - Задача
 * @param chatId - Личный чат
 * @returns Итог для счётчиков или unauthorized
 */
async function checkOne(botToken: string, job: ChatAccessCheckJobView, chatId: string) {
  let probe: ChatAccessProbe = { kind: 'error', status: 'error' };
  for (let attempt = 0; attempt < RETRY_LIMIT; attempt += 1) {
    probe = await probePrivateChatAccess(botToken, chatId);
    if (probe.kind === 'unauthorized') return 'unauthorized' as const;
    if (probe.kind !== 'retry') break;
    await sleep((probe.retryAfter ?? 1) * 1000);
  }
  const toSave = probe.kind === 'retry' ? { kind: 'error' as const, status: 'error' as const } : probe;
  await persistChatAccessOutcome(job.projectId, job.tokenId, chatId, toSave);
  return toSave.kind;
}

/**
 * Завершает задачу и шлёт финальное событие.
 * @param jobId - Задача
 * @param status - Финальный статус
 * @param counts - Последние счётчики
 * @returns Завершение
 */
async function finish(jobId: number, status: ChatAccessCheckStatus, counts: ChatAccessCheckJobView) {
  const saved = await updateChatAccessCheckJob(jobId, {
    status, finishedAt: new Date(),
    processedCount: counts.processedCount, availableCount: counts.availableCount,
    kickedCount: counts.kickedCount, deletedCount: counts.deletedCount, errorCount: counts.errorCount,
  });
  if (saved) await publishChatAccessCheckProgress(saved);
}

/**
 * Проверяет личные диалоги пакетами, не останавливаясь на ошибке одного чата.
 * @param jobId - Идентификатор задачи
 * @param botToken - Токен бота, не пишется в логи и WS
 * @returns Завершение очереди
 */
export async function runChatAccessCheckQueue(jobId: number, botToken: string): Promise<void> {
  if (activeChatAccessChecks.get(jobId) === 'stopped') {
    const existing = await getChatAccessCheckJobUnscoped(jobId);
    if (existing) await finish(jobId, 'cancelled', existing);
    return;
  }
  activeChatAccessChecks.set(jobId, 'running');
  try {
    const job = await getChatAccessCheckJobUnscoped(jobId);
    if (!job) return;
    const users = await listPrivateUserIds(job.projectId, job.tokenId);
    const counts = { ...job, totalCount: users.length };
    await updateChatAccessCheckJob(jobId, { totalCount: users.length });
    for (const chatId of users) {
      if (activeChatAccessChecks.get(jobId) === 'stopped') {
        await finish(jobId, 'cancelled', counts);
        return;
      }
      let kind: Awaited<ReturnType<typeof checkOne>> | 'error' = 'error';
      try {
        kind = await checkOne(botToken, job, chatId);
      } catch {
        kind = 'error';
      }
      if (kind === 'unauthorized') {
        await finish(jobId, 'failed', counts);
        return;
      }
      counts.processedCount += 1;
      if (kind === 'available') counts.availableCount += 1;
      else if (kind === 'kicked') counts.kickedCount += 1;
      else if (kind === 'deleted') counts.deletedCount += 1;
      else counts.errorCount += 1;
      if (activeChatAccessChecks.get(jobId) === 'stopped') {
        await finish(jobId, 'cancelled', counts);
        return;
      }
      void publishChatAccessCheckProgress({ ...counts, status: 'running' });
      if (counts.processedCount % 10 === 0) {
        await updateChatAccessCheckJob(jobId, {
          totalCount: counts.totalCount, processedCount: counts.processedCount,
          availableCount: counts.availableCount, kickedCount: counts.kickedCount,
          deletedCount: counts.deletedCount, errorCount: counts.errorCount,
        });
      }
      await sleep(DELAY_MS);
    }
    await finish(jobId, 'completed', counts);
  } catch {
    const existing = await getChatAccessCheckJobUnscoped(jobId);
    if (existing) await finish(jobId, 'failed', existing);
  } finally {
    activeChatAccessChecks.delete(jobId);
  }
}
