/**
 * @fileoverview HTTP start/status/cancel массовой проверки доступов.
 * @module server/routes/dialogs/chat-access-check-handlers
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { isActiveChatAccessCheckStatus } from '@shared/project-sync/project-event';
import { storage } from '../../storages/storage';
import {
  createRunningChatAccessCheckJob,
  getChatAccessCheckJob,
  getRelevantChatAccessCheckJob,
  updateChatAccessCheckJob,
} from './chat-access-check-job-store';
import { listPrivateUserIds } from './chat-access-check-audience';
import { activeChatAccessChecks, publishChatAccessCheckProgress, runChatAccessCheckQueue } from './chat-access-check-queue';

const tokenSchema = z.object({
  /** Бот, чьи личные диалоги проверяются. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

/**
 * Проверяет, что токен принадлежит проекту и не пустой.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Запись токена или null
 */
async function ownedToken(projectId: number, tokenId: number) {
  const botToken = await storage.getBotToken(tokenId);
  if (!botToken || botToken.projectId !== projectId || !botToken.token) return null;
  return botToken;
}

/**
 * Запускает одну фоновую проверку на пару проект+токен.
 * @param req - Запрос с tokenId в body или query
 * @param res - 201 с задачей, 409 если проверка уже идёт
 * @returns Завершение
 */
export async function startChatAccessCheckHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const parsed = tokenSchema.safeParse({ tokenId: req.body?.tokenId ?? req.query?.tokenId });
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !parsed.success) {
    res.status(400).json({ message: 'Некорректные параметры проверки' }); return;
  }
  const botToken = await ownedToken(projectId, parsed.data.tokenId);
  if (!botToken) { res.status(404).json({ message: 'Бот не найден в проекте' }); return; }
  const users = await listPrivateUserIds(projectId, botToken.id);
  const created = await createRunningChatAccessCheckJob(projectId, botToken.id, users.length);
  if (!created) { res.status(409).json({ message: 'Проверка уже выполняется' }); return; }
  if (users.length === 0) {
    const done = await updateChatAccessCheckJob(created.jobId, { status: 'completed', finishedAt: new Date() });
    res.status(201).json({ job: done ?? created }); return;
  }
  void runChatAccessCheckQueue(created.jobId, botToken.token).catch(() => undefined);
  res.status(201).json({ job: created });
}

/**
 * Возвращает активную или последнюю задачу выбранного бота.
 * @param req - Query tokenId
 * @param res - `{ job }` без секретов
 * @returns Завершение
 */
export async function getActiveChatAccessCheckHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const parsed = tokenSchema.safeParse(req.query);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !parsed.success) {
    res.status(400).json({ message: 'Некорректные параметры проверки' }); return;
  }
  const botToken = await ownedToken(projectId, parsed.data.tokenId);
  if (!botToken) { res.status(404).json({ message: 'Бот не найден в проекте' }); return; }
  const job = await getRelevantChatAccessCheckJob(projectId, botToken.id);
  res.json({ job });
}

/**
 * Останавливает оставшуюся очередь задачи этого проекта.
 * @param req - jobId в пути
 * @param res - Обновлённая задача
 * @returns Завершение
 */
export async function cancelChatAccessCheckHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const jobId = Number(req.params.jobId);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !Number.isSafeInteger(jobId) || jobId < 1) {
    res.status(400).json({ message: 'Некорректные параметры проверки' }); return;
  }
  const job = await getChatAccessCheckJob(projectId, jobId);
  if (!job) { res.status(404).json({ message: 'Проверка не найдена' }); return; }
  if (!isActiveChatAccessCheckStatus(job.status)) {
    res.status(400).json({ message: 'Проверка уже завершена' }); return;
  }
  const inProcess = activeChatAccessChecks.has(jobId);
  activeChatAccessChecks.set(jobId, 'stopped');
  const updated = await updateChatAccessCheckJob(jobId, {
    status: inProcess ? 'cancelling' : 'cancelled',
    ...(inProcess ? {} : { finishedAt: new Date() }),
  });
  if (updated) await publishChatAccessCheckProgress(updated);
  res.json({ job: updated ?? job });
}
