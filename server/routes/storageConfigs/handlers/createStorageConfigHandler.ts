/**
 * @fileoverview Хендлер создания конфига хранилища `POST /api/storage-configs`.
 *
 * Принимает несекретные параметры и (для S3) креды доступа, которые сразу
 * шифруются через `encryptCredentials` в `secretsEnc` (Req 11.3, 11.4). После
 * вставки перестраивает реестр хранилищ (`registry.reload()`, Req 10.7).
 * Ответ — безопасный DTO без секретов.
 * @module server/routes/storageConfigs/handlers/createStorageConfigHandler
 */

import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../../database/db";
import { storageConfigs, type InsertStorageConfig } from "@shared/schema";
import { getStorageRegistry } from "../../../storage/storage-registry";
import {
  encryptCredentials,
  isEncryptionConfigured,
} from "../../../storage/storage-secrets";

import {
  createStorageConfigSchema,
  toStorageConfigDto,
} from "../storage-config-dto";

/**
 * Обрабатывает запрос на создание конфига хранилища.
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function createStorageConfigHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parsed = createStorageConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Некорректные данные", details: parsed.error.issues });
      return;
    }
    const input = parsed.data;
    const id = input.id ?? `${input.backend}-${randomUUID()}`;

    // Проверяем уникальность идентификатора.
    const existing = await db
      .select({ id: storageConfigs.id })
      .from(storageConfigs)
      .where(eq(storageConfigs.id, id))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: `Хранилище с id "${id}" уже существует` });
      return;
    }

    // Шифруем креды S3, если переданы (только для backend=s3).
    let secretsEnc: string | null = null;
    if (input.backend === "s3" && input.s3AccessKeyId && input.s3SecretAccessKey) {
      if (!isEncryptionConfigured()) {
        res.status(400).json({
          error: "Шифрование не настроено: задайте STORAGE_ENCRYPTION_KEY для хранения кредов S3",
        });
        return;
      }
      secretsEnc = encryptCredentials({
        accessKeyId: input.s3AccessKeyId,
        secretAccessKey: input.s3SecretAccessKey,
      });
    }

    const draft: InsertStorageConfig = {
      id,
      name: input.name,
      backend: input.backend,
      isActive: false,
      config: input.config as Record<string, unknown>,
      secretsEnc,
      readOnly: input.readOnly,
    };

    const [created] = await db.insert(storageConfigs).values(draft).returning();
    await getStorageRegistry().reload();
    res.status(201).json(toStorageConfigDto(created));
  } catch (error: any) {
    console.error("Ошибка создания хранилища:", error);
    res.status(500).json({ error: "Не удалось создать хранилище" });
  }
}
