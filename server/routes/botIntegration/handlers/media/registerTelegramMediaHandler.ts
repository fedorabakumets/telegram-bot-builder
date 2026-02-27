/**
 * @fileoverview Хендлер регистрации медиафайла из Telegram
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на регистрацию медиафайла из Telegram и связывания его с сообщением.
 *
 * @module botIntegration/handlers/media/registerTelegramMediaHandler
 */

import type { Request, Response } from "express";
import {
    downloadTelegramAudio,
    downloadTelegramDocument,
    downloadTelegramPhoto,
    downloadTelegramVideo
} from "../../../../telegram/telegram-media";
import { storage } from "../../../../storages/storage";

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

        // Загружаем медиа из Telegram в зависимости от типа
        let downloadedFile;
        switch (mediaType) {
            case 'video':
                downloadedFile = await downloadTelegramVideo(botToken, fileId, projectId);
                break;
            case 'audio':
                downloadedFile = await downloadTelegramAudio(botToken, fileId, projectId);
                break;
            case 'document':
                downloadedFile = await downloadTelegramDocument(botToken, fileId, projectId, originalFileName);
                break;
            case 'photo':
            default:
                downloadedFile = await downloadTelegramPhoto(botToken, fileId, projectId);
                break;
        }

        // Генерируем URL для файла (относительно от public root)
        const fileUrl = `/${downloadedFile.filePath}`;

        // Определяем тип файла на основе типа медиа
        let fileType: 'photo' | 'video' | 'audio' | 'document';
        if (mediaType === 'video') {
            fileType = 'video';
        } else if (mediaType === 'audio') {
            fileType = 'audio';
        } else if (mediaType === 'document') {
            fileType = 'document';
        } else {
            fileType = 'photo';
        }

        // Создаём запись медиафайла в базе данных
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

        // Связываем медиафайл с сообщением
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
