/**
 * @fileoverview Хендлер обновления конфига хранилища
 * `PATCH /api/storage-configs/:id`.
 *
 * Позволяет менять имя, несекретные параметры (`config`), режим только-чтения и
 * креды S3 (принимаются только при явной передаче → перешифровка, Req 11.4).
 * Поддерживает set-active: при `isActive=true` снимает активность у всех прочих,
 * гарантируя ровно одно активное хранилище (Req 11.6). После изменения
 * перестраивает реестр (`registry.reload()`, Req 10.7). Ответ — DTO без секретов.
 * @module server/routes/storageConfigs/handlers/updateStorageConfigHandler
 */

import type { Request, Response } from "express";
import { eq, ne } from "drizzle-orm";

import { db } from "../../../database/db";
import { storageConfigs } from "@shared/schema";
import { getStorageRegistry } from "../../../storage/storage-registry";
import {
  encryptCredentials,
  isEncryptionConfigured,
} from "../../../storage/storage-secrets";

import {
  updateStorageConfigSchema,
  toStorageConfigDto,
  type UpdateStorageConfigInput,
} from "../storage-config-dto";

/**
 * Собирает объект частичного обновления из валидированного тела запроса.
 * @param input - Валидированные поля запроса
 * @returns Частичный объект полей `storage_configs` для обновления
 */
function buildPatch(input: UpdateStorageConfigInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.config !== undefined) patch.config = input.config;
  if (input.readOnly !== undefined) patch.readOnly = input.readOnly;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  return patch;
}

/**
 * Обрабатывает запрос на обновление конфига хранилища.
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function updateStorageConfigHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = req.params.id;
    const parsed = updateStorageConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Некорректные данные", details: parsed.error.issues });
      return;
    }
    const input = parsed.data;

    const [row] = await db
      .select()
      .from(storageConfigs)
      .where(eq(storageConfigs.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Хранилище не найдено" });
      return;
    }

    const patch = buildPatch(input);

    // Перешифровываем креды S3 только при явной передаче новых значений.
    if (input.s3AccessKeyId && input.s3SecretAccessKey) {
      if (!isEncryptionConfigured()) {
        res.status(400).json({
          error: "Шифрование не настроено: задайте STORAGE_ENCRYPTION_KEY для хранения кредов S3",
        });
        return;
      }
      patch.secretsEnc = encryptCredentials({
        accessKeyId: input.s3AccessKeyId,
        secretAccessKey: input.s3SecretAccessKey,
      });
    }

    const updated = await db.transaction(async (tx) => {
      // Set-active: снимаем активность у всех остальных конфигов.
      if (input.isActive === true) {
        await tx
          .update(storageConfigs)
          .set({ isActive: false })
          .where(ne(storageConfigs.id, id));
      }
      const [res2] = await tx
        .update(storageConfigs)
        .set(patch)
        .where(eq(storageConfigs.id, id))
        .returning();
      return res2;
    });

    await getStorageRegistry().reload();
    res.json(toStorageConfigDto(updated));
  } catch (error: any) {
    console.error("Ошибка обновления хранилища:", error);
    res.status(500).json({ error: "Не удалось обновить хранилище" });
  }
}
