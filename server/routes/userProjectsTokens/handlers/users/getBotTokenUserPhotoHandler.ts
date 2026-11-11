/** @fileoverview Авторизованный поток аватара для передачи между разными ботами без сохранения на диск. */
import type { Request, Response } from 'express';
import { getBotUsersAccess } from './bot-users-access';
import { parseBotUserId } from './bot-users-params';
import { findBotTokenUser } from './bot-users-repository';
import { getBotUserPhoto } from './bot-user-photo-cache';
import { streamTelegramFile } from '../../../botIntegration/handlers/botData/telegram-file-stream';

/**
 * Передаёт аватар после проверки пользователя в области выбранного бота.
 * @param req - Запрос после определения актора и проверки доступа к токену
 * @param res - Ответ с ранее проверенным контекстом доступа
 * @returns Завершение передачи файла либо ответа с ошибкой
 */
export async function getBotTokenUserPhotoHandler(req: Request, res: Response): Promise<void> {
  const access = getBotUsersAccess(res);
  if (!access) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }
  const userId = parseBotUserId(req.params.userId);
  if (userId === null) { res.status(400).json({ error: 'Некорректный userId' }); return; }
  try {
    const user = await findBotTokenUser(access, userId);
    if (!user) { res.status(404).json({ error: 'Пользователь не найден' }); return; }
    const { photoFileId } = await getBotUserPhoto({ ...access, userId });
    if (!photoFileId) { res.status(404).json({ error: 'Фотография не найдена' }); return; }
    await streamTelegramFile(req, res, {
      token: access.token, fileId: photoFileId, maxBytes: 5 * 1024 * 1024, timeoutMs: 10_000,
    });
  } catch {
    console.error('[BotTokenUserPhoto] Не удалось передать фотографию пользователя');
    if (!res.headersSent) res.status(502).json({ error: 'Не удалось получить фотографию' });
    else res.destroy();
  }
}
