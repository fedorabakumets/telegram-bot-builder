/** @fileoverview Авторизованный поиск сохранённого текста диалогов выбранного бота. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { pool } from '../../database/db';
import { encodeMessageCursor } from './message-pagination';
import { buildDialogSearchQuery, dialogSearchParams } from './message-search-query';
import { mapDialogMessage } from './message-mapping';

/**
 * Возвращает последние совпадения без вызовов Telegram.
 * @param req - Проект и фильтры поиска
 * @param res - Страница совпадений от новых к старым
 * @returns Завершение обработки
 */
export async function searchDialogMessagesHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const parsed = dialogSearchParams.safeParse(req.query);
  if (!/^[1-9]\d*$/.test(req.params.projectId) || !Number.isSafeInteger(projectId) || !parsed.success) {
    res.status(400).json({ error: 'Некорректные параметры поиска сообщений' }); return;
  }
  let query;
  try { query = buildDialogSearchQuery(projectId, parsed.data); }
  catch { res.status(400).json({ error: 'Некорректный курсор или изменены фильтры поиска' }); return; }
  try {
    const { tokenId, limit, chatId, chatType, query: text } = parsed.data;
    const token = await storage.getBotToken(tokenId);
    if (!token || token.projectId !== projectId) {
      res.status(404).json({ error: 'Бот не найден в проекте' }); return;
    }
    const { rows } = await pool.query(query.sql, query.values);
    const messages = rows.slice(0, limit).map(mapDialogMessage);
    const last = messages.at(-1);
    const hasMore = rows.length > limit;
    res.json({ ok: true, project_id: projectId, token_id: tokenId, query: text,
      chat_id: chatId ?? null, chat_type: chatType ?? null, messages, has_more: hasMore,
      next_cursor: hasMore && last ? encodeMessageCursor({ scope: query.scope,
        time: last.created_at, id: last.id as number }) : null });
  } catch { res.status(500).json({ error: 'Не удалось выполнить поиск сообщений' }); }
}
