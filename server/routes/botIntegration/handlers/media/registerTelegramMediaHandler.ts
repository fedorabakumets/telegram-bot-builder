/**
 * @fileoverview Хендлер регистрации медиафайла из Telegram
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на регистрацию медиафайла из Telegram и связывания его с сообщением.
 *
 * @module botIntegration/handlers/media/registerTelegramMediaHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { downloadMediaFromTelegram } from "./utils/downloadMedia";
import { getFileType } from "./utils/getFileType";

/**
 * Обрабатывает запрос на регистрацию медиафайла
 *
 * @function registerTelegramMediaHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function registerTelegramMediaHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const { messageId, fileId, botToken, mediaType = 'photo', originalFileName } = req.body;

        if (!messageId || !fileId || !botToken) {
            res.status(400).json({
                message: "Отсутствуют обязательные поля: messageId, fileId, botToken"
            });
            return;
        }

        const downloadedFile = await downloadMediaFromTelegram(
            botToken,
            fileId,
            projectId,
            mediaType,
            originalFileName
        );

        const fileUrl = `/${downloadedFile.filePath}`;
        const fileType = getFileType(mediaType);

        const mediaFile = await storage.createMediaFile({
            projectId,
            fileName: downloadedFile.fileName,
            fileType,
            filePath: downloadedFile.filePath,
            fileSize: downloadedFile.fileSize,
            mimeType: downloadedFile.mimeType,
            url: fileUrl,
            description: `Telegram ${mediaType} от пользователя`,
            tags: [],
            isPublic: 0,
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
            url: fileUrl
        });
    } catch (error) {
        console.error("Ошибка регистрации медиа из Telegram:", error);
        res.status(500).json({
            message: "Не удалось зарегистрировать медиа",
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
}
