/**
 * @fileoverview Обработчик установки фото группы
 *
 * @module botIntegration/groups/settings/setGroupPhoto
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Устанавливает фото группы через Telegram Bot API
 *
 * @function setGroupPhotoHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/set-group-photo
 */
export async function setGroupPhotoHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, photoPath } = req.body;

        if (!groupId || !photoPath) {
            res.status(400).json({ 
                message: "Требуются ID группы и путь к фото" 
            });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ 
                message: "Токен бота не найден для этого проекта" 
            });
            return;
        }

        const result = await uploadGroupPhoto(defaultToken.token, groupId, photoPath);

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось установить фото группы",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Фото группы успешно обновлено" 
        });
    } catch (error: any) {
        console.error("Не удалось установить фото группы:", error);
        res.status(500).json({
            message: "Не удалось установить фото группы",
            error: error.message || "Неизвестная ошибка"
        });
    }
}

/**
 * Загружает фото группы через multipart/form-data
 *
 * @function uploadGroupPhoto
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {string} photoPath - Путь к файлу фото
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function uploadGroupPhoto(
    token: string,
    groupId: string,
    photoPath: string
): Promise<{ success: boolean; error?: string }> {
    const fs = await import('fs');
    const path = await import('path');

    const photoBuffer = fs.readFileSync(photoPath);
    const fileName = path.basename(photoPath);

    // Создаем multipart form data
    const boundary = '----formdata-replit-' + Math.random().toString(36);
    const CRLF = '\r\n';

    let body = '';
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}`;
    body += `${groupId}${CRLF}`;
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="photo"; filename="${fileName}"${CRLF}`;
    body += `Content-Type: image/png${CRLF}${CRLF}`;

    const bodyBuffer = Buffer.concat([
        Buffer.from(body, 'utf8'),
        photoBuffer,
        Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8')
    ]);

    const telegramApiUrl = `https://api.telegram.org/bot${token}/setChatPhoto`;
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length.toString(),
        },
        body: bodyBuffer,
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
