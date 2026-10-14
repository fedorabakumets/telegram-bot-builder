/** @fileoverview Авторизованный список диалогов выбранного бота. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { pool as dbPool } from '../../database/db';
import { dialogParams, encodeDialogCursor } from './dialog-pagination';
import { buildDialogListQuery } from './dialog-list-query';

/**
 * Читает список без обращения к Telegram.
 * @param req - Запрос с проектом, токеном и фильтрами
 * @param res - Ответ с диалогами и курсором
 * @returns Завершение обработки
 */
export async function listDialogsHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const parsed = dialogParams.safeParse(req.query);
  if (!/^[1-9]\d*$/.test(req.params.projectId) || !Number.isSafeInteger(projectId) || !parsed.success) {
    res.status(400).json({ error: 'Некорректные параметры списка диалогов' }); return;
  }
  const { tokenId, limit } = parsed.data;
  let query;
  try { query = buildDialogListQuery(projectId, parsed.data); }
  catch { res.status(400).json({ error: 'Некорректный курсор или изменены фильтры' }); return; }
  try {
    const token = await storage.getBotToken(tokenId);
    if (!token || token.projectId !== projectId) {
      res.status(404).json({ error: 'Бот не найден в проекте' }); return;
    }
    const result = await dbPool.query(query.sql, query.values);
    /** Нормализуем также время внутри JSON сообщения, которое PostgreSQL отдаёт с +00:00. */
    const dialogs = result.rows.slice(0, limit).map((row) => ({ ...row,
      last_message: row.last_message ? { ...row.last_message,
        created_at: row.last_message.created_at ? new Date(row.last_message.created_at).toISOString() : null } : null,
    }));
    const hasMore = result.rows.length > limit;
    const last = dialogs.at(-1);
    const next = hasMore && last ? encodeDialogCursor({ scope: query.scope,
      time: last.last_activity_at ? new Date(last.last_activity_at).toISOString() : null,
      type: last.chat_type, id: last.chat_id }) : null;
    res.json({ ok: true, project_id: projectId, token_id: tokenId, dialogs, has_more: hasMore, next_cursor: next });
  } catch {
    res.status(500).json({ error: 'Не удалось получить список диалогов' });
  }
}
