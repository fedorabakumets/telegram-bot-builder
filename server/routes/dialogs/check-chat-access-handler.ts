/** @fileoverview Авторизованное чтение сохранённого состояния доступа к чату. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { pool } from '../../database/db';
import { z } from 'zod';

const paramsSchema = z.object({
  /** Идентификатор токена бота. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  /** Тип чата для согласованности ответа. */
  chatType: z.enum(['private', 'group', 'supergroup', 'channel']),
});

/**
 * Возвращает сохранённую проверку, не вызывая Telegram.
 * @param req - Запрос с проектом, чатом и токеном
 * @param res - HTTP-ответ
 * @returns Завершение обработки
 */
export async function checkChatAccessHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const chatId = req.params.chatId;
  const parsed = paramsSchema.safeParse(req.query);
  if (!/^[1-9]\d*$/.test(req.params.projectId) || !Number.isSafeInteger(projectId)
    || !/^-?[1-9]\d{0,19}$/.test(chatId) || !parsed.success) {
    res.status(400).json({ error: 'Некорректные параметры проверки доступа' }); return;
  }
  try {
    const { tokenId, chatType } = parsed.data;
    const token = await storage.getBotToken(tokenId);
    if (!token || token.projectId !== projectId) {
      res.status(404).json({ error: 'Бот не найден в проекте' }); return;
    }
    const result = await pool.query(`SELECT status, checked_at FROM chat_access
      WHERE project_id = $1 AND token_id = $2 AND chat_id = $3`, [projectId, tokenId, chatId]);
    const row = result.rows[0];
    res.json({ ok: true, project_id: projectId, token_id: tokenId, chat_id: chatId,
      chat_type: chatType, access_status: row?.status ?? 'unknown',
      access_checked_at: row?.checked_at ? new Date(row.checked_at).toISOString() : null });
  } catch { res.status(500).json({ error: 'Не удалось получить состояние доступа' }); }
}
