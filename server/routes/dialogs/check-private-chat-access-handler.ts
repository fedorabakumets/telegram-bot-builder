/**
 * @fileoverview Фактическая проверка доступа бота к личному чату.
 * @module server/routes/dialogs/check-private-chat-access-handler
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../storages/storage';
import { saveChatAccess } from './access-store';
import { persistChatAccessOutcome, probePrivateChatAccess } from './check-chat-access-core';
import type { ChatAccessProbe } from './check-chat-access-classify';

const querySchema = z.object({
  /** Явно выбранный токен бота. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

/**
 * Проверяет личный чат действием typing без отправки сообщения.
 * @param req - Запрос с проектом, чатом и токеном
 * @param res - HTTP-ответ без секретов и текста Telegram
 * @returns Завершение обработки
 */
export async function checkPrivateChatAccessHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const chatId = req.params.chatId;
  const parsed = querySchema.safeParse(req.query);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !/^[1-9]\d{0,19}$/.test(chatId) || !parsed.success) {
    res.status(400).json({ message: 'Некорректные параметры проверки доступа' }); return;
  }
  const { tokenId } = parsed.data;
  try {
    const botToken = await storage.getBotToken(tokenId);
    if (!botToken || botToken.projectId !== projectId || !botToken.token) {
      res.status(404).json({ message: 'Бот не найден в проекте' }); return;
    }
    const probe = await probePrivateChatAccess(botToken.token, chatId);
    const toSave: ChatAccessProbe = probe.kind === 'retry' || probe.kind === 'unauthorized'
      ? { kind: 'error', status: 'error' }
      : probe;
    const access = await persistChatAccessOutcome(projectId, tokenId, chatId, toSave);
    const blocked = probe.kind === 'kicked';
    const known = probe.kind === 'available' || probe.kind === 'kicked' || probe.kind === 'deleted';
    res.status(known ? 200 : 400).json({ checked: true, blocked, ...access });
  } catch {
    const access = await saveChatAccess(projectId, tokenId, chatId, 'error').catch(() => undefined);
    res.status(500).json({ message: 'Не удалось проверить личный чат', ...access });
  }
}
