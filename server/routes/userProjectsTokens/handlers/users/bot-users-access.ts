/** @fileoverview Общая проверка доступа к пользователям токена без повторных запросов. */
import type { NextFunction, Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getBotActorId } from "../../../../middleware/bot-api-actor";
import { parseBotTokenId, parseBotUserId, parseBotUsersPagination } from "./bot-users-params";
/** Проверенная область доступа текущего запроса. */
export interface BotUsersAccess {
  /** Идентификатор токена. */
  tokenId: number;
  /** Идентификатор проекта. */
  projectId: number;
  /** Секрет Telegram для получения фотографии. */
  token: string;
}
/**
 * Возвращает ранее проверенный контекст.
 * @param res - Ответ текущего запроса.
 * @returns Контекст либо отсутствие проверки.
 */
export function getBotUsersAccess(res: Response): BotUsersAccess | undefined {
  return res.locals.botUsersAccess as BotUsersAccess | undefined;
}
/**
 * Проверяет параметры и один раз проверяет доступ действующего пользователя к проекту.
 * @param req - Запрос после определения действующего пользователя.
 * @param res - Ответ с локальным контекстом.
 * @param next - Следующий обработчик.
 * @returns Завершение проверки.
 */
export async function requireBotUsersTokenAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const actorId = getBotActorId(req);
  if (actorId === null) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
  /** Не передаём в БД дробные и небезопасные идентификаторы делегированного актора. */
  if (!Number.isSafeInteger(actorId) || actorId <= 0) {
    res.status(400).json({ error: "Некорректный идентификатор действующего пользователя" }); return;
  }
  const tokenId = parseBotTokenId(req.params.tokenId);
  if (tokenId === null) { res.status(400).json({ error: "Некорректный tokenId" }); return; }
  if (req.params.userId !== undefined && parseBotUserId(req.params.userId) === null) {
    res.status(400).json({ error: "Некорректный userId" }); return;
  }
  if (req.params.userId === undefined && parseBotUsersPagination(req.query) === null) {
    res.status(400).json({ error: "Некорректные параметры пагинации" }); return;
  }
  try {
    const record = await storage.getBotToken(tokenId);
    if (!record || (req.params.userId !== undefined && !record.token)) {
      res.status(404).json({ error: "Токен не найден" }); return;
    }
    if (!(await storage.hasProjectAccess(record.projectId, actorId))) {
      res.status(403).json({ error: "Нет доступа к этому проекту" }); return;
    }
    res.locals.botUsersAccess = { tokenId, projectId: record.projectId, token: record.token } satisfies BotUsersAccess;
    next();
  } catch {
    console.error("[BotTokenUsers] Не удалось проверить доступ к токену");
    res.status(500).json({ error: "Не удалось проверить доступ" });
  }
}
