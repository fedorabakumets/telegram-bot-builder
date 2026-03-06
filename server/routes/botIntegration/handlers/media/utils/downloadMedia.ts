/**
 * @fileoverview Утилита загрузки медиа из Telegram
 *
 * Этот модуль предоставляет функцию для загрузки медиафайла
 * из Telegram в зависимости от типа.
 *
 * @module botIntegration/handlers/media/utils/downloadMedia
 */

import {
    downloadAudio,
    downloadDocument,
    downloadPhoto,
    downloadVideo
} from "../../../../../telegram/telegram-media";

/**
 * Загружает медиафайл из Telegram
 *
 * @function downloadMediaFromTelegram
 * @param {string} botToken - Токен бота
 * @param {string} fileId - ID файла в Telegram
 * @param {number} projectId - ID проекта
 * @param {string} mediaType - Тип медиа
 * @param {string} [originalFileName] - Оригинальное имя файла
 * @returns {Promise<unknown>} Загруженный файл
 */
export async function downloadMediaFromTelegram(
    botToken: string,
    fileId: string,
    projectId: number,
    mediaType: string,
    originalFileName?: string
) {
    switch (mediaType) {
        case 'video':
            return await downloadVideo(botToken, fileId, projectId);
        case 'audio':
            return await downloadAudio(botToken, fileId, projectId);
        case 'document':
            return await downloadDocument(botToken, fileId, projectId, originalFileName);
        case 'photo':
        default:
            return await downloadPhoto(botToken, fileId, projectId);
    }
}
