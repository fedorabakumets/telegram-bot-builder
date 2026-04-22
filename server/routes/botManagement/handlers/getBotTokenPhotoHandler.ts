/**
 * @fileoverview Хендлер получения аватарки бота по tokenId
 *
 * Принимает tokenId, получает токен из БД, делает запросы к Telegram API,
 * скачивает файл локально и возвращает путь /uploads/... чтобы бот мог
 * передать его через FSInputFile в send_photo.
 *
 * @module botManagement/handlers/getBotTokenPhotoHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { fetchWithProxy } from '../../../utils/telegram-proxy';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

/**
 * Нормализует tokenId — срезает префикс `token_` если он есть
 * @param raw - Сырое значение из параметра маршрута
 * @returns Числовой идентификатор токена
 */
function parseTokenId(raw: string): number {
    const cleaned = raw.startsWith('token_') ? raw.slice(6) : raw;
    return parseInt(cleaned, 10);
}

/**
 * Скачивает файл по URL и сохраняет на диск
 * @param url - URL для скачивания
 * @param destPath - Путь для сохранения файла
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const resp = await fetchWithProxy(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error(`Ошибка скачивания: ${resp.status}`);
    const dest = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(resp.body as any), dest);
}

/**
 * Обрабатывает GET /api/bot/tokens/:tokenId/photo
 *
 * Принимает tokenId в формате `131` или `token_131`.
 * Получает токен из БД, запрашивает аватарку через Telegram API,
 * скачивает файл в uploads/{projectId}/ и возвращает локальный путь.
 * Бот использует этот путь через FSInputFile для send_photo.
 *
 * @param req - Объект запроса Express (query: telegram_id)
 * @param res - Объект ответа Express
 * @returns Promise<void>
 */
export async function getBotTokenPhotoHandler(req: Request, res: Response): Promise<void> {
    try {
        const tokenId = parseTokenId(req.params.tokenId);

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        if (isNaN(tokenId)) {
            res.status(400).json({ error: 'Некорректный tokenId', photoUrl: null });
            return;
        }

        // Получаем запись токена из БД
        const tokenRecord = await storage.getBotToken(tokenId);
        if (!tokenRecord?.token) {
            res.status(404).json({ error: 'Токен не найден', photoUrl: null });
            return;
        }

        const token = tokenRecord.token;
        const baseUrl = `https://api.telegram.org/bot${token}`;

        // Шаг 1: getMe — получаем id бота
        const getMeResp = await fetchWithProxy(`${baseUrl}/getMe`, {
            signal: AbortSignal.timeout(10000),
        });

        if (!getMeResp.ok) {
            res.json({ photoUrl: null, total_count: 0 });
            return;
        }

        const getMeData = await getMeResp.json() as { ok: boolean; result?: { id: number } };
        if (!getMeData.ok || !getMeData.result?.id) {
            res.json({ photoUrl: null, total_count: 0 });
            return;
        }

        const botUserId = getMeData.result.id;

        // Шаг 2: getUserProfilePhotos — проверяем наличие фото
        const photosResp = await fetchWithProxy(
            `${baseUrl}/getUserProfilePhotos?user_id=${botUserId}&limit=1`,
            { signal: AbortSignal.timeout(10000) },
        );

        if (!photosResp.ok) {
            res.json({ photoUrl: null, total_count: 0 });
            return;
        }

        const photosData = await photosResp.json() as {
            ok: boolean;
            result?: { total_count: number; photos: Array<Array<{ file_id: string }>> };
        };

        const totalCount = photosData.result?.total_count ?? 0;

        if (!photosData.ok || totalCount === 0 || !photosData.result?.photos?.[0]?.[0]) {
            res.json({ photoUrl: null, total_count: 0 });
            return;
        }

        const fileId = photosData.result.photos[0][photosData.result.photos[0].length - 1].file_id;

        // Шаг 3: getFile — получаем file_path
        const fileResp = await fetchWithProxy(
            `${baseUrl}/getFile?file_id=${fileId}`,
            { signal: AbortSignal.timeout(10000) },
        );

        if (!fileResp.ok) {
            res.json({ photoUrl: null, total_count: totalCount });
            return;
        }

        const fileData = await fileResp.json() as {
            ok: boolean;
            result?: { file_path: string };
        };

        if (!fileData.ok || !fileData.result?.file_path) {
            res.json({ photoUrl: null, total_count: totalCount });
            return;
        }

        const telegramFileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

        // Шаг 4: скачиваем файл в uploads/{projectId}/bot_photos/
        const projectId = tokenRecord.projectId;
        const uploadDir = join(process.cwd(), 'uploads', String(projectId), 'bot_photos');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `token_${tokenId}_avatar.jpg`;
        const localFilePath = join(uploadDir, fileName);
        const localUrlPath = `/uploads/${projectId}/bot_photos/${fileName}`;

        await downloadFile(telegramFileUrl, localFilePath);

        res.json({ photoUrl: localUrlPath, total_count: totalCount });
    } catch (error: any) {
        console.error('[BotTokenPhoto] Ошибка:', error.message);
        res.status(500).json({ error: 'Не удалось получить аватарку', photoUrl: null });
    }
}
