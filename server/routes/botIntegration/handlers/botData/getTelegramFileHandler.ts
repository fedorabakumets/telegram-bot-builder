/**
 * @fileoverview Хендлер streaming-прокси для получения файлов из Telegram CDN.
 * Скрывает токен бота от клиента, пайпя поток напрямую без буферизации в память.
 * Поддерживает Range-запросы — браузер может перематывать видео/аудио без полной загрузки.
 * @module botIntegration/handlers/botData/getTelegramFileHandler
 */

import { Readable } from "node:stream";
import type { Request, Response } from "express";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { getRequestTokenId, resolveProjectBotToken } from "../../../utils/resolve-request-token";

/**
 * Проксирует запрос на получение файла из Telegram CDN через streaming.
 * Range-заголовок пробрасывается напрямую в Telegram CDN — сервер не буферизует файл.
 *
 * @route GET /api/projects/:projectId/telegram-file?fileId=...
 * @param req - Запрос с projectId в params, fileId в query и опциональным Range заголовком
 * @param res - Ответ с потоком содержимого файла
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

    // Пробрасываем Range-заголовок напрямую в Telegram CDN
    const fileUrl = `https://api.telegram.org/file/bot${botToken.token}/${fileData.result.file_path}`;
    const upstreamHeaders: Record<string, string> = {};
    if (req.headers["range"]) {
      upstreamHeaders["Range"] = req.headers["range"] as string;
    }

    const fileResp = await fetchWithProxy(fileUrl, { headers: upstreamHeaders });

    if (!fileResp.ok && fileResp.status !== 206) {
      res.status(404).json({ message: "Не удалось получить файл" });
      return;
    }

    // Пробрасываем заголовки от Telegram CDN клиенту
    const contentType = fileResp.headers.get("content-type") || "application/octet-stream";
    const contentLength = fileResp.headers.get("content-length");
    const contentRange = fileResp.headers.get("content-range");
    const acceptRanges = fileResp.headers.get("accept-ranges") || "bytes";

    res.status(fileResp.status);
    res.set("Content-Type", contentType);
    res.set("Accept-Ranges", acceptRanges);
    res.set("Cache-Control", "public, max-age=86400");

    if (contentLength) res.set("Content-Length", contentLength);
    if (contentRange) res.set("Content-Range", contentRange);

    // Пайпим поток напрямую — без буферизации в память
    if (!fileResp.body) {
      res.status(500).json({ message: "Пустое тело ответа от Telegram" });
      return;
    }

    const nodeStream = Readable.fromWeb(fileResp.body as any);
    nodeStream.pipe(res);

    // Обрабатываем разрыв соединения клиентом
    req.on("close", () => nodeStream.destroy());

  } catch (error) {
    console.error("Ошибка получения файла из Telegram:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Не удалось получить файл" });
    }
  }
}
