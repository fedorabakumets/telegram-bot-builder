/**
 * @fileoverview Хендлеры списка диалогов поддержки в админке
 * @module server/support/handlers/admin-support-list-handlers
 */

import type { Request, Response } from "express";
import { countAdminUnread, queryAdminSupportThreads } from "../admin-support-list-query";
import { adminSupportListFilterSchema } from "../support-validation";

/**
 * GET /admin/api/support/threads?status=open|closed|all — список диалогов
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminSupportThreads(req: Request, res: Response): Promise<void> {
  const filter = adminSupportListFilterSchema.parse(req.query.status);

  try {
    const items = await queryAdminSupportThreads(filter);
    res.json({ items });
  } catch (err) {
    console.error("[support] Ошибка списка диалогов:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

/**
 * GET /admin/api/support/unread — сколько сообщений ждут ответа
 * @param _req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminSupportUnread(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ total: await countAdminUnread() });
  } catch (err) {
    console.error("[support] Ошибка подсчёта непрочитанного:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
