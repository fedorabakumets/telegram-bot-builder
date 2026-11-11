/** @fileoverview Прокси файлов Telegram с явным выбором токена после проверки доступа к проекту. */
import type { Request, Response } from 'express';
import { resolveDevMediaToken } from './dev-media-token';
import { parseTelegramFileRequest, resolveTelegramFileToken } from './telegram-file-request';
import { streamTelegramFile } from './telegram-file-stream';
/** Проверяет параметры и передаёт поток без подмены явно указанного токена.
 * @param req - Запрос после requireProjectAccess.
 * @param res - Ответ браузеру.
 * @returns Завершение обработки.
 */
export async function getTelegramFileHandler(req: Request, res: Response): Promise<void> {
  const input = parseTelegramFileRequest(req);
  if (!input) { res.status(400).json({ message: 'Неверные параметры запроса' }); return; }
  try {
    const token = await resolveTelegramFileToken(input);
    if (!token) { res.status(404).json({ message: 'Токен бота не найден' }); return; }
    const mediaToken = await resolveDevMediaToken(input.projectId, token.id) ?? token.token;
    await streamTelegramFile(req, res, { token: mediaToken, fileId: input.fileId });
  } catch {
    if (!res.headersSent && !res.destroyed) res.status(500).json({ message: 'Не удалось получить файл' });
  }
}
