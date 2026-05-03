/**
 * @fileoverview Хендлер прокси для получения файлов из Telegram CDN
 * Скрывает токен бота от клиента, проксируя запросы к Telegram API.
 * Поддерживает Range-запросы для корректного воспроизведения видео/аудио в браузере.
 * @module botIntegration/handlers/botData/getTelegramFileHandler
 */

import type { Request, Response } from "express";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { getRequestTokenId, resolveProjectBotToken } from "../../../utils/resolve-request-token";

/**
 * Парсит заголовок Range и возвращает start/end байты.
 * @param rangeHeader - Значение заголовка Range (например "bytes=0-1023")
 * @param totalSize - Полный размер файла в байтах
 * @returns Объект с start, end или null если заголовок некорректный
 */
function parseRange(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
  if (start > end || end >= totalSize) return null;
  return { start, end };
}

/**
 * Проксирует запрос на получение файла из Telegram CDN.
 * Поддерживает Range-запросы — браузер может перематывать видео/аудио без полной загрузки.
 *
 * @route GET /api/projects/:projectId/telegram-file?fileId=...
 * @param req - Запрос с projectId в params, fileId в query и опциональным Range заголовком
 * @param res - Ответ с содержимым файла (полным или частичным при Range)
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

    const contentType = fileResp.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await fileResp.arrayBuffer());
    const totalSize = buffer.length;

    // Сообщаем браузеру что поддерживаем Range-запросы
    res.set("Accept-Ranges", "bytes");
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");

    const rangeHeader = req.headers["range"];

    if (rangeHeader) {
      // Частичный ответ для Range-запроса (перемотка видео/аудио)
      const range = parseRange(rangeHeader, totalSize);
      if (!range) {
        res.status(416).set("Content-Range", `bytes */${totalSize}`).end();
        return;
      }
      const { start, end } = range;
      const chunkSize = end - start + 1;
      res.status(206);
      res.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
      res.set("Content-Length", String(chunkSize));
      res.end(buffer.slice(start, end + 1));
    } else {
      // Полный ответ
      res.set("Content-Length", String(totalSize));
      res.status(200).end(buffer);
    }
  } catch (error) {
    console.error("Ошибка получения файла из Telegram:", error);
    res.status(500).json({ message: "Не удалось получить файл" });
  }
}
