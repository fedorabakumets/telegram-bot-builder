/** @fileoverview Авторизованное чтение страницы сохранённых сообщений конкретного диалога. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { pool } from '../../database/db';
import { dialogMessageParams, encodeMessageCursor } from './message-pagination';
import { buildDialogMessageQuery } from './message-query';
import { mapDialogMessage } from './message-mapping';

/**
 * Читает историю выбранного бота, не вызывая Telegram.
 * @param req - Проект, чат и параметры истории
 * @param res - Страница в хронологическом порядке
 * @returns Завершение обработки
 */
export async function getDialogMessagesHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const chatId = req.params.chatId;
  const parsed = dialogMessageParams.safeParse(req.query);
  if (!/^[1-9]\d*$/.test(req.params.projectId) || !Number.isSafeInteger(projectId)
    || !/^-?[1-9]\d{0,19}$/.test(chatId) || !parsed.success) {
    res.status(400).json({ error: 'Некорректные параметры истории диалога' }); return;
  }
  let query;
  try { query = buildDialogMessageQuery(projectId, chatId, parsed.data); }
  catch { res.status(400).json({ error: 'Некорректный курсор или изменена область истории' }); return; }
  try {
    const { tokenId, limit, chatType, includeGroupContext } = parsed.data;
    const token = await storage.getBotToken(tokenId);
    if (!token || token.projectId !== projectId) {
      res.status(404).json({ error: 'Бот не найден в проекте' }); return;
    }
    const { rows } = await pool.query(query.sql, query.values);
    const selected = rows.slice(0, limit).map(mapDialogMessage);
    const last = selected.at(-1);
    const hasMore = rows.length > limit;
    const cursor = hasMore && last ? encodeMessageCursor({ scope: query.scope,
      time: last.created_at, id: last.id as number }) : null;
    res.json({ ok: true, project_id: projectId, token_id: tokenId, chat_id: chatId,
      chat_type: chatType, include_group_context: includeGroupContext,
      messages: selected.reverse(), has_more: hasMore, next_cursor: cursor });
  } catch { res.status(500).json({ error: 'Не удалось получить историю диалога' }); }
}
