/** @fileoverview Маршрут ручной проверки ботов Telegram в авторизованном проекте. */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../storages/storage';
import { telegramBotCheckTask } from './telegram-bot-check-task';
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
import { BotHistoryConflictError, telegramBotHistoryStore } from './telegram-bot-history-store';
/** Проверяемая область; null означает все боты проекта. */
const bodySchema = z.object({ tokenId: z.number().int().positive().nullable().optional() }).strict();
/**
 * Проверяет выбранного бота либо весь проект после middleware доступа.
 * @param req - Авторизованный запрос с проектом и необязательным tokenId.
 * @param res - Безопасный итог проверки без секретов.
 * @returns Завершение HTTP-ответа.
 */
export async function checkTelegramBotsHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const parsed = bodySchema.safeParse(req.body ?? {});
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !parsed.success) {
    res.status(400).json({ message: 'Неверная область проверки ботов' }); return;
  }
  try {
    const tokenId = parsed.data.tokenId ?? null;
    const all = await storage.getBotTokensByProject(projectId);
    const tokens = tokenId === null ? all : all.filter(token => token.id === tokenId);
    if (tokenId !== null && !tokens.length) { res.status(404).json({ message: 'Бот проекта не найден' }); return; }
    const task = await telegramBotCheckTask(projectId, tokenId, tokens);
    if (!req.headers.accept?.includes('application/x-ndjson')) { res.json(await task.promise); return; }
    /** Старый JSON-ответ сохранён, новый интерфейс получает каждое завершение отдельной строкой. */
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Accel-Buffering', 'no'); res.flushHeaders();
    const write = (type: string, result: TelegramBotCheckResult) => {
      if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify({ type, result, total: task.total, runId: task.run.id, startedAt: task.run.startedAt,
        finishedAt: task.run.finishedAt, status: task.run.status }) + '\n');
    };
    const progress = (result: TelegramBotCheckResult) => write('progress', result);
    const detach = () => task.listeners.delete(progress);
    task.listeners.add(progress); res.once('close', detach); progress(task.result);
    try { const result = await task.promise; write('complete', result); }
    finally { detach(); res.off('close', detach); if (!res.destroyed && !res.writableEnded) res.end(); }
  } catch (error) {
    if (res.headersSent) { if (!res.destroyed && !res.writableEnded) res.end(); return; }
    if (error instanceof BotHistoryConflictError) { res.status(409).json({ message: error.message }); return; }
    res.status(500).json({ message: 'Не удалось проверить ботов в Telegram' });
  }
}

/** Восстанавливает сохранённый прогресс, не выполняя запросов Telegram. @param req - Проект и необязательный бот. @param res - Текущий запуск либо null. */
export async function getActiveTelegramBotCheckHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const raw = req.query.tokenId;
  const tokenId = raw == null ? null : typeof raw === 'string' && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(projectId) || projectId < 1 || (tokenId !== null && !Number.isSafeInteger(tokenId))) {
    res.status(400).json({ message: 'Неверная область проверки ботов' }); return;
  }
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ run: await telegramBotHistoryStore.getActive(projectId, tokenId) });
  } catch { res.status(500).json({ message: 'Не удалось получить текущую проверку ботов' }); }
}
