/**
 * @fileoverview Хендлер списка конфигов хранилищ `GET /api/storage-configs`.
 *
 * Возвращает все записи `storage_configs` в виде безопасных DTO без секретов
 * (Req 11.2, 11.5): наружу отдаётся только факт наличия кредов (`hasSecrets`).
 * Аутентификация обеспечивается глобальным `requireApiAuth` (deny-by-default).
 * @module server/routes/storageConfigs/handlers/listStorageConfigsHandler
 */

import type { Request, Response } from "express";

import { db } from "../../../database/db";
import { storageConfigs } from "@shared/schema";

import { toStorageConfigDto } from "../storage-config-dto";

/**
 * Обрабатывает запрос на получение списка конфигов хранилищ (без секретов).
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function listStorageConfigsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rows = await db.select().from(storageConfigs);
    res.json(rows.map(toStorageConfigDto));
  } catch (error: any) {
    console.error("Ошибка получения списка хранилищ:", error);
    res.status(500).json({ error: "Не удалось получить список хранилищ" });
  }
}
