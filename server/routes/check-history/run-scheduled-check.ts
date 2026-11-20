/** @fileoverview Запуск расписания через существующие очереди проверок с повторной проверкой прав. */
import { storage } from '../../storages/storage';
import { telegramBotCheckTask } from '../users/telegram-bot-check-task';
import { BotHistoryConflictError, telegramBotHistoryStore } from '../users/telegram-bot-history-store';
import { chatAccessBatchStore } from '../dialogs/chat-access-batch-store';
import { runChatAccessBatch } from '../dialogs/chat-access-batch-worker';
import { listPrivateUserIds } from '../dialogs/chat-access-check-audience';
import { createRunningChatAccessCheckJob, updateChatAccessCheckJob } from '../dialogs/chat-access-check-job-store';
import { runChatAccessCheckQueue } from '../dialogs/chat-access-check-queue';
/** Запускает выбранный вид без создания второй параллельной проверки того же бота. @param row - Зарезервированное расписание из доверенной БД. @returns Безопасный результат запуска. */
export async function runScheduledCheck(row: Record<string, any>): Promise<'started' | 'skipped_active' | 'access_revoked' | 'bot_removed'> {
  if (!await storage.hasProjectAccess(row.project_id, Number(row.created_by))) return 'access_revoked';
  const all = await storage.getBotTokensByProject(row.project_id);
  const tokens = row.token_id === null ? all : all.filter(bot => bot.id === row.token_id);
  if (!tokens.length) return 'bot_removed';
  if (row.kind === 'telegram-bots') {
    await telegramBotHistoryStore.interruptExpired(row.project_id);
    if (await telegramBotHistoryStore.getActive(row.project_id, row.token_id)) return 'skipped_active';
    try {
      const task = await telegramBotCheckTask(row.project_id,row.token_id,tokens);
      void task.promise.catch(() => undefined);
      return 'started';
    } catch (error) { if (error instanceof BotHistoryConflictError) return 'skipped_active'; throw error; }
  }
  await chatAccessBatchStore.failExpired(row.project_id);
  if (row.token_id === null) {
    const plans = [];
    for (const token of tokens) plans.push({ tokenId: token.id, total: (await listPrivateUserIds(row.project_id,token.id)).length });
    const batch = await chatAccessBatchStore.create(row.project_id, plans);
    if (!batch) return 'skipped_active';
    void runChatAccessBatch(row.project_id,batch.id).catch(() => undefined); return 'started';
  }
  const total = (await listPrivateUserIds(row.project_id,row.token_id)).length;
  const job = await createRunningChatAccessCheckJob(row.project_id,row.token_id,total);
  if (!job) return 'skipped_active';
  if (!total) await updateChatAccessCheckJob(job.jobId,{ status: 'completed', finishedAt: new Date() });
  else void runChatAccessCheckQueue(job.jobId,tokens[0].token).catch(() => undefined);
  return 'started';
}
