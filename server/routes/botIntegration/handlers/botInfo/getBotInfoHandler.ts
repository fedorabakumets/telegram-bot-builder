/**
 * @fileoverview Хендлер getMe профиля бота проекта
 * @module botIntegration/handlers/botInfo/getBotInfoHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
  analyzeTelegramError,
  getErrorStatusCode,
} from "../../../../utils/telegram-error-handler";
import { getRequestTokenId } from "../../../utils/resolve-request-token";

/**
 * Возвращает getMe (+ наличие фото) для токена проекта.
 * Query `tokenId` — конкретный бот; иначе default токен.
 * @param req - params.projectId|id, query.tokenId
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function getBotInfoHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId ?? req.params.id, 10);
    const requestedTokenId = getRequestTokenId(req);

    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    let botToken =
      requestedTokenId != null
        ? await storage.getBotToken(requestedTokenId)
        : await storage.getDefaultBotToken(projectId);

    if (botToken && botToken.projectId !== projectId) {
      res.status(403).json({ message: "Токен не принадлежит этому проекту" });
      return;
    }

    if (!botToken) {
      res.json({ hasToken: false });
      return;
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken.token}/getMe?_t=${Date.now()}`;
    const response = await fetchWithProxy(telegramApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();
    if (!response.ok) {
      res.status(400).json({
        message: "Не удалось получить информацию о боте",
        error: result.description || "Неизвестная ошибка",
      });
      return;
    }

    const botInfo = result.result;
    let hasPhoto = !!botToken.botPhotoUrl;

    if (!hasPhoto) {
      try {
        const photoResp = await fetchWithProxy(
          `https://api.telegram.org/bot${botToken.token}/getUserProfilePhotos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: botInfo.id, limit: 1 }),
          },
        );
        const photoData = await photoResp.json();
        if (photoResp.ok && photoData.result?.total_count > 0) {
          const fileId = photoData.result.photos[0].at(-1).file_id;
          await storage.updateBotToken(botToken.id, { botPhotoUrl: fileId });
          hasPhoto = true;
        }
      } catch (e) {
        console.warn("[getBotInfo] failed to fetch bot photo:", e);
      }
    }

    res.json({
      ...botInfo,
      photoUrl: hasPhoto ? true : null,
      tokenId: botToken.id,
    });
  } catch (error) {
    const errorInfo = analyzeTelegramError(error);
    console.error("Ошибка получения информации о боте:", errorInfo);
    const statusCode = getErrorStatusCode(errorInfo.type);
    res.status(statusCode).json({
      message: errorInfo.userFriendlyMessage,
      errorType: errorInfo.type,
      details: process.env.NODE_ENV === "development" ? errorInfo.message : undefined,
    });
  }
}
