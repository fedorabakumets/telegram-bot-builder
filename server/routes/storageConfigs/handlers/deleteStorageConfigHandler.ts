/**
 * @fileoverview Хендлер удаления конфига хранилища
 * `DELETE /api/storage-configs/:id`.
 *
 * Запрещает удаление, если на хранилище ещё есть файлы: при наличии хотя бы
 * одной записи `media_files` со ссылкой на этот `storageConfigId` возвращает
 * `409` (Req 11.8). Иначе удаляет конфиг и перестраивает реестр
 * (`registry.reload()`, Req 10.7).
 * @module server/routes/storageConfigs/handlers/deleteStorageConfigHandler
 */

import type { Request, Response } from "express";
import { eq, count } from "drizzle-orm";

import { db } from "../../../database/db";
import { storageConfigs, mediaFiles } from "@shared/schema";
import { getStorageRegistry } from "../../../storage/storage-registry";

/**
 * Обрабатывает запрос на удаление конфига хранилища.
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function deleteStorageConfigHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = req.params.id;

    const [row] = await db
      .select({ id: storageConfigs.id })
      .from(storageConfigs)
      .where(eq(storageConfigs.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Хранилище не найдено" });
      return;
    }

    // Проверяем наличие файлов на этом хранилище (Req 11.8).
    const [filesCount] = await db
      .select({ value: count() })
      .from(mediaFiles)
      .where(eq(mediaFiles.storageConfigId, id));
    if ((filesCount?.value ?? 0) > 0) {
      res.status(409).json({
        error: "Нельзя удалить хранилище: на нём есть файлы",
        filesCount: filesCount.value,
      });
      return;
    }

    await db.delete(storageConfigs).where(eq(storageConfigs.id, id));
    await getStorageRegistry().reload();
    res.json({ ok: true, id });
  } catch (error: any) {
    console.error("Ошибка удаления хранилища:", error);
    res.status(500).json({ error: "Не удалось удалить хранилище" });
  }
}
