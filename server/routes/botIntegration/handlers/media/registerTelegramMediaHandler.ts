/**
 * @fileoverview Хендлер регистрации медиафайла из Telegram
 *
 * Сохраняет file_id в БД без скачивания файла.
 * Превью доступно через проксирование /api/projects/:id/telegram-file.
 *
 * @module botIntegration/handlers/media/registerTelegramMediaHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getFileType } from "./utils/getFileType";

/**
 * Регистрирует медиафайл из Telegram — сохраняет file_id без скачивания.
 * Файл доступен через проксирование Telegram CDN.
 *
 * @param req - Запрос с projectId, messageId, fileId, botToken, mediaType
 * @param res - Ответ с созданной записью медиафайла
 */
export async function registerTelegramMediaHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const { messageId, fileId, botToken, mediaType = 'photo', originalFileName } = req.body;

        if (!messageId || !fileId) {
            res.status(400).json({
                message: "Отсутствуют обязательные поля: messageId, fileId"
            });
            return;
        }

        const fileType = getFileType(mediaType);
        const fileName = originalFileName || `${mediaType}_${fileId.slice(0, 20)}`;

        const mediaFile = await storage.createMediaFile({
            projectId,
            fileName,
            fileType,
            filePath: "",
            fileSize: 0,
            mimeType: mediaType === 'photo' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'application/octet-stream',
            url: `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(fileId)}`,
            description: `Telegram ${mediaType}`,
            tags: [],
            isPublic: 0,
            telegramFileId: fileId,
        });

        await storage.createBotMessageMedia({
            messageId: parseInt(messageId),
            mediaFileId: mediaFile.id,
            mediaKind: fileType,
            orderIndex: 0,
        });

        res.json({
            message: "Медиа успешно зарегистрировано",
            mediaFile,
            url: mediaFile.url,
        });
    } catch (error) {
        console.error("Ошибка регистрации медиа из Telegram:", error);
        res.status(500).json({
            message: "Не удалось зарегистрировать медиа",
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
}
