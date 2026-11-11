/** @fileoverview Получение страницы пользователей после единой проверки доступа к токену. */
import type { Request, Response } from "express";
import { getBotUsersAccess } from "./bot-users-access";
import { parseBotUsersPagination } from "./bot-users-params";
import { listBotTokenUsers } from "./bot-users-repository";
/**
 * Возвращает страницу пользователей с навигационными полями для сообщений бота.
 * @param req - Запрос с параметрами страницы.
 * @param res - Ответ с проверенным контекстом доступа.
 * @returns Завершение отправки ответа.
 */
export async function getBotTokenUsersHandler(req: Request, res: Response): Promise<void> {
  const access = getBotUsersAccess(res);
  if (!access) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
  const pagination = parseBotUsersPagination(req.query);
  if (!pagination) { res.status(400).json({ error: "Некорректные параметры пагинации" }); return; }
  try {
    const { limit, offset } = pagination;
    const { items, count } = await listBotTokenUsers(access, pagination);
    const nextOffset = offset + limit < count ? offset + limit : null;
    const prevOffset = offset > 0 ? Math.max(0, offset - limit) : null;
    const fromItem = items.length > 0 ? offset + 1 : 0;
    const toItem = items.length > 0 ? Math.min(offset + items.length, count) : 0;
    res.json({ items, count, nextOffset, prevOffset, fromItem, toItem });
  } catch {
    console.error("[BotTokenUsers] Не удалось загрузить страницу пользователей");
    res.status(500).json({ error: "Не удалось получить пользователей" });
  }
}
