/**
 * @fileoverview Хендлер проверки доступности хранилища
 * `POST /api/storage-configs/:id/test`.
 *
 * Загружает запись `storage_configs` по id и выполняет connectivity-проверку:
 * для S3 — `HeadBucketCommand`/`ListObjectsV2`, для локального — доступность
 * папки на запись (Req 11.9). При неудаче возвращает `400` с диагностикой и НЕ
 * активирует конфиг (активация — отдельным PATCH set-active).
 * @module server/routes/storageConfigs/handlers/testStorageConfigHandler
 */

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../../database/db";
import { storageConfigs } from "@shared/schema";

import { testStorageConfig } from "../storage-config-test";

/**
 * Обрабатывает запрос на проверку доступности хранилища.
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function testStorageConfigHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = req.params.id;

    const [row] = await db
      .select()
      .from(storageConfigs)
      .where(eq(storageConfigs.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Хранилище не найдено" });
      return;
    }

    const result = await testStorageConfig(row);
    if (!result.ok) {
      // Доступность не подтверждена — 400 с диагностикой, без активации (Req 11.9).
      res.status(400).json({ ok: false, message: result.message });
      return;
    }
    res.json({ ok: true, message: result.message });
  } catch (error: any) {
    console.error("Ошибка проверки хранилища:", error);
    res.status(500).json({ error: "Не удалось проверить хранилище" });
  }
}
