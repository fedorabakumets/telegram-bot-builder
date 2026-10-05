/**
 * @fileoverview Отдача картинки вложения поддержки только участнику диалога или администратору
 * @module server/support/handlers/support-attachment-handlers
 */

import { pipeline } from "stream/promises";
import type { Request, Response } from "express";
import { getStorageRegistry } from "../../storage/storage-registry";
import { getOwnerIdFromRequest } from "../../telegram/auth-middleware";
import { findSupportAttachmentAccess } from "../support-attachments-repo";
import { parseSupportId } from "../support-validation";

/**
 * Собирает Content-Disposition: inline с исходным именем
 * @param fileName - Имя файла
 * @returns Значение заголовка
 */
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Отдаёт поток картинки. ownerId задан у пользовательского маршрута и должен совпасть с автором диалога
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @param ownerId - Автор или null для администратора
 */
async function streamSupportAttachment(
  req: Request,
  res: Response,
  ownerId: number | null,
): Promise<void> {
  const id = parseSupportId(req.params.id);
  if (id == null) {
    res.status(400).json({ error: "Неверный идентификатор" });
    return;
  }

  const found = await findSupportAttachmentAccess(id);
  if (!found || (ownerId != null && found.userId !== ownerId)) {
    res.status(404).json({ error: "Файл не найден" });
    return;
  }

  const { attachment } = found;
  const stream = await getStorageRegistry()
    .resolveBackend(attachment.storageConfigId)
    .get(attachment.storageKey);
  res.setHeader("Content-Type", attachment.mime);
  res.setHeader("Content-Length", String(attachment.size));
  res.setHeader("Content-Disposition", contentDisposition(attachment.fileName));
  res.setHeader("Cache-Control", "private, max-age=3600");
  await pipeline(stream, res);
}

/**
 * GET /api/support/attachments/:id — картинка своего диалога
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetUserSupportAttachment(req: Request, res: Response): Promise<void> {
  const userId = getOwnerIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Требуется авторизация через Telegram" });
    return;
  }
  try {
    await streamSupportAttachment(req, res, userId);
  } catch (err) {
    console.error("[support] Ошибка файла вложения:", err);
    if (!res.headersSent) res.status(500).json({ error: "Не удалось отдать файл" });
  }
}

/**
 * GET /admin/api/support/attachments/:id — картинка для администратора
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminSupportAttachment(req: Request, res: Response): Promise<void> {
  try {
    await streamSupportAttachment(req, res, null);
  } catch (err) {
    console.error("[support] Ошибка файла вложения:", err);
    if (!res.headersSent) res.status(500).json({ error: "Не удалось отдать файл" });
  }
}
