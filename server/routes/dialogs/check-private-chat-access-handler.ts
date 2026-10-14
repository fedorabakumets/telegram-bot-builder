/**
 * @fileoverview Фактическая проверка доступа бота к личному чату.
 * @module server/routes/dialogs/check-private-chat-access-handler
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../database/db';
import { storage } from '../../storages/storage';
import { fetchWithProxy } from '../../utils/telegram-proxy';
import { saveChatAccess } from './access-store';

const querySchema = z.object({
  /** Явно выбранный токен бота. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

/**
 * Проверяет личный чат безопасным действием typing без отправки сообщения.
 * @param req - Запрос с проектом, пользователем и токеном
 * @param res - HTTP-ответ с сохранённым результатом
 * @returns Завершение обработки
 */
export async function checkPrivateChatAccessHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const chatId = req.params.chatId;
  const parsed = querySchema.safeParse(req.query);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !/^[1-9]\d{0,19}$/.test(chatId)
    || !parsed.success) {
    res.status(400).json({ message: 'Некорректные параметры проверки доступа' }); return;
  }
  const { tokenId } = parsed.data;
  try {
    const botToken = await storage.getBotToken(tokenId);
    if (!botToken || botToken.projectId !== projectId || !botToken.token) {
      res.status(404).json({ message: 'Бот не найден в проекте' }); return;
    }
    const response = await fetchWithProxy(`https://api.telegram.org/bot${botToken.token}/sendChatAction`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }), signal: AbortSignal.timeout(12_000),
    });
    const telegram = await response.json();
    const blocked = /bot was blocked/i.test(String(telegram?.description ?? ''));
    const status = response.ok && telegram?.ok ? 'available' : blocked ? 'kicked' : 'error';
    const access = await saveChatAccess(projectId, tokenId, chatId, status);
    if (blocked || status === 'available') {
      await pool.query(`UPDATE bot_users SET is_blocked = $1
        WHERE project_id = $2 AND token_id = $3 AND user_id = $4`,
      [blocked ? 1 : 0, projectId, tokenId, chatId]);
    }
    res.status(status === 'available' || blocked ? 200 : 400).json({
      checked: true, blocked, ...access,
    });
  } catch {
    const access = await saveChatAccess(projectId, tokenId, chatId, 'error').catch(() => undefined);
    res.status(500).json({ message: 'Не удалось проверить личный чат', ...access });
  }
}
