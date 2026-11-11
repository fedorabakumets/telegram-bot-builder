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

import { db, pool } from "../../../database/db";
import { storageConfigs, mediaFiles, projectVersions } from "@shared/schema";
import { getStorageRegistry, ensureStorageRegistryLoaded } from "../../../storage/storage-registry";
import { S3Backend } from '../../../storage/s3-backend';

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
    /** Настроенное хранилище ожидающих версий нельзя удалять. */
    if (id === process.env.VERSION_SNAPSHOT_STORAGE_ID?.trim()) {
      res.status(409).json({ error: 'Нельзя удалить активное хранилище снимков версий' });
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

    /** Конфигурация нужна также готовым снимкам и очереди их удаления. */
    const [versionsCount] = await db.select({ value: count() }).from(projectVersions)
      .where(eq(projectVersions.snapshotStorageId, id));
    if ((versionsCount?.value ?? 0) > 0) {
      res.status(409).json({ error: 'Нельзя удалить хранилище: на нём есть версии проектов', versionsCount: versionsCount.value });
      return;
    }
    const queued = await pool.query('SELECT 1 FROM project_version_object_deletions WHERE storage_id = $1 LIMIT 1', [id]);
    if (queued.rowCount) {
      res.status(409).json({ error: 'Нельзя удалить хранилище: ожидается очистка версий' });
      return;
    }
    const backend = (await ensureStorageRegistryLoaded()).resolveBackend(id);
    if (backend instanceof S3Backend) {
      /** Незарегистрированные объекты также требуют очистки до удаления конфига. */
      const objects = await backend.listObjects('project-versions/');
      if (objects.objects.length > 0) {
        res.status(409).json({ error: 'Нельзя удалить хранилище: остались объекты версий' });
        return;
      }
    }

    await db.delete(storageConfigs).where(eq(storageConfigs.id, id));
    await getStorageRegistry().reload();
    res.json({ ok: true, id });
  } catch (error: any) {
    console.error("Ошибка удаления хранилища:", error);
    res.status(500).json({ error: "Не удалось удалить хранилище" });
  }
}
