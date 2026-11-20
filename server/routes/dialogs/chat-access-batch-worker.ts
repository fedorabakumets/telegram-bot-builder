/** @fileoverview Параллельная проверка ботов с независимыми очередями чатов, общим итогом и отменой. */
import { randomUUID } from 'node:crypto';
import { storage } from '../../storages/storage';
import { isActiveChatAccessCheckStatus } from '../../../shared/project-sync/project-event';
import { chatAccessBatchStore } from './chat-access-batch-store';
import { activeChatAccessChecks, runChatAccessCheckQueue } from './chat-access-check-queue';
import { updateChatAccessCheckJob } from './chat-access-check-job-store';
/** Активные группы этого процесса; задачи остаются в PostgreSQL после закрытия вкладки. */
export const runningChatAccessBatches = new Set<number>();
/** Останавливает текущую задачу и все ещё не начатые задачи группы. @param projectId - Проект. @param id - Группа. @param interrupted - Причина остановки — перезапуск сервера. */
export async function stopChatAccessBatch(projectId: number, id: number, interrupted = false) {
  const batch = await chatAccessBatchStore.get(projectId, id);
  if (!batch || !isActiveChatAccessCheckStatus(batch.status)) return;
  await chatAccessBatchStore.setStatus(projectId, id, interrupted ? 'failed' : 'cancelling', interrupted ? 'worker_interrupted' : undefined);
  for (const job of batch.jobs) {
    if (!isActiveChatAccessCheckStatus(job.status)) continue;
    const running = activeChatAccessChecks.has(job.jobId);
    if (running) activeChatAccessChecks.set(job.jobId, 'stopped');
    await updateChatAccessCheckJob(job.jobId, {
      status: interrupted ? 'failed' : running ? 'cancelling' : 'cancelled',
      failureReason: interrupted ? 'worker_interrupted' : 'user_cancelled',
      ...(!running || interrupted ? { finishedAt: new Date() } : {}),
    });
  }
  if (!runningChatAccessBatches.has(id) && !interrupted) await chatAccessBatchStore.setStatus(projectId, id, 'cancelled');
}
/** Запускает существующую очередь отдельно для каждого бота параллельно. @param projectId - Проект. @param id - Группа. */
export async function runChatAccessBatch(projectId: number, id: number): Promise<void> {
  const workerId = randomUUID();
  if (!await chatAccessBatchStore.claim(projectId,id,workerId)) return;
  runningChatAccessBatches.add(id);
  /** Аренда не позволяет чужому процессу принять живую проверку за перезапуск. */
  const heartbeat = setInterval(() => { void chatAccessBatchStore.heartbeat(projectId,id,workerId).catch(() => undefined); },15_000);
  heartbeat.unref();
  try {
    const initial = await chatAccessBatchStore.get(projectId, id);
    if (!initial) return;
    await Promise.all(initial.jobs.map(async planned => {
      const batch = await chatAccessBatchStore.get(projectId, id);
      if (!batch || batch.status !== 'running') return;
      const job = batch.jobs.find(item => item.jobId === planned.jobId);
      if (!job || job.status !== 'pending') return;
      try {
        const token = await storage.getBotToken(job.tokenId);
        if (!token || token.projectId !== projectId || !token.token) throw new Error('Бот недоступен');
        if ((await chatAccessBatchStore.get(projectId, id))?.status !== 'running') return;
        /** Резервируется до следующего ожидания, чтобы отмена не потерялась между стартами. */
        activeChatAccessChecks.set(job.jobId, 'running');
        await updateChatAccessCheckJob(job.jobId, { status: 'running', startedAt: new Date() });
        await runChatAccessCheckQueue(job.jobId, token.token);
      } catch {
        await updateChatAccessCheckJob(job.jobId, { status: 'failed', finishedAt: new Date(), failureReason: 'bot_unavailable' });
      } finally { activeChatAccessChecks.delete(job.jobId); }
    }));
    const final = await chatAccessBatchStore.get(projectId, id);
    if (final?.status === 'cancelling') await chatAccessBatchStore.setStatus(projectId, id, 'cancelled');
    else if (final?.status === 'running') {
      /** Частично провалившаяся группа не выдаётся за полностью успешную. */
      const failed = final.jobs.some(job => job.status !== 'completed');
      await chatAccessBatchStore.setStatus(projectId,id,failed ? 'failed' : 'completed',failed ? 'partial_failure' : undefined);
    }
  } catch {
    await stopChatAccessBatch(projectId, id, true);
  } finally { clearInterval(heartbeat); runningChatAccessBatches.delete(id); }
}
