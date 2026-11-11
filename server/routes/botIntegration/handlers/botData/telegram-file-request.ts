/** @fileoverview Строгие параметры и выбор токена потокового прокси Telegram. */
import type { Request } from 'express';
import { storage } from '../../../../storages/storage';

/** Проверенные параметры прокси. */
export interface TelegramFileRequest {
  /** Проект файла. */
  projectId: number;
  /** Идентификатор файла Telegram. */
  fileId: string;
  /** Явно выбранный токен либо отсутствие выбора. */
  tokenId: number | null;
}

/** Проверяет десятичный идентификатор без преобразования массивов.
 * @param raw - Сырое значение.
 * @returns Идентификатор либо null.
 */
function parseId(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value <= 2147483647 ? value : null;
}

/** Проверяет параметры до обращения к Telegram.
 * @param req - Входящий запрос.
 * @returns Проверенные параметры либо null.
 */
export function parseTelegramFileRequest(req: Request): TelegramFileRequest | null {
  const projectId = parseId(req.params.projectId);
  const fileId = req.query.fileId;
  const rawToken = req.query.tokenId ?? req.body?.tokenId ?? req.params.tokenId;
  const tokenId = rawToken === undefined ? null : parseId(rawToken);
  if (projectId === null || typeof fileId !== 'string' || !fileId || fileId.length > 2048
    || (rawToken !== undefined && tokenId === null)) return null;
  return { projectId, fileId, tokenId };
}

/** Выбирает токен без подмены ошибочного явного выбора токеном по умолчанию.
 * @param input - Проверенные параметры.
 * @returns Токен этого проекта либо undefined.
 */
export async function resolveTelegramFileToken(input: TelegramFileRequest) {
  if (input.tokenId === null) return storage.getDefaultBotToken(input.projectId);
  const token = await storage.getBotToken(input.tokenId);
  return token?.projectId === input.projectId ? token : undefined;
}
