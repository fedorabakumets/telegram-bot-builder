/**
 * @fileoverview Хендлер прокси для получения файлов из Telegram CDN
 * Скрывает токен бота от клиента, проксируя запросы к Telegram API.
 * @module botIntegration/handlers/botData/getTelegramFileHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { getRequestTokenId, resolveProjectBotToken } from "../../../utils/resolve-request-token";

/**
 * Проксирует запрос на получение файла из Telegram CDN.
 * Принимает fileId, получает токен бота из БД, запрашивает у Telegram
 * путь к файлу и перенаправляет браузер на скачивание.
 *
 * @route GET /api/projects/:projectId/telegram-file?fileId=...
 * @param req - Запрос с projectId в params и fileId в query
 * @param res - Ответ с содержимым файла или редиректом
 */
export async function getTelegramFileHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const fileId = req.query.fileId as string;
    const tokenId = getRequestTokenId(req);

    if (isNaN(projectId) || !fileId) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    // Получаем токен бота из БД
    const botToken = await resolveProjectBotToken(projectId, tokenId);
    if (!botToken) {
      res.status(404).json({ message: "Токен бота не найден" });
      return;
    }

    // Запрашиваем у Telegram путь к файлу
    const getFileResp = await fetchWithProxy(
      `https://api.telegram.org/bot${botToken.token}/getFile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      }
    );

    if (!getFileResp.ok) {
      res.status(404).json({ message: "Файл не найден в Telegram" });
      return;
    }

    const fileData = await getFileResp.json();
    if (!fileData.result?.file_path) {
      res.status(404).json({ message: "Путь к файлу не получен" });
      return;
    }

    // Скачиваем файл с Telegram CDN через прокси
    const fileUrl = `https://api.telegram.org/file/bot${botToken.token}/${fileData.result.file_path}`;
    const fileResp = await fetchWithProxy(fileUrl);

    if (!fileResp.ok) {
      res.status(404).json({ message: "Не удалось скачать файл" });
      return;
    }

    // Отдаём файл клиенту с кэшированием на 24 часа (file_id живёт ~24ч)
    res.set("Content-Type", fileResp.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");

    const buffer = await fileResp.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Ошибка получения файла из Telegram:", error);
    res.status(500).json({ message: "Не удалось получить файл" });
  }
}
