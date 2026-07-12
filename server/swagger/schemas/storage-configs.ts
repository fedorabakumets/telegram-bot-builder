/**
 * @fileoverview OpenAPI-схемы реестра внешних хранилищ
 * @module server/swagger/schemas/storage-configs
 */

import "./common";
import { z } from "zod";

/** Безопасный DTO конфига хранилища (без секретов) */
export const StorageConfigDtoSchema = z
  .object({
    /** Стабильный ID конфига */
    id: z.string().openapi({ example: "s3-main" }),
    /** Человекочитаемое имя */
    name: z.string().openapi({ example: "Основное S3" }),
    /** Тип бэкенда */
    backend: z.enum(["local", "s3"]).openapi({ example: "s3" }),
    /** Активно для новых загрузок */
    isActive: z.boolean().openapi({ example: false }),
    /** Несекретные параметры (bucket, endpoint…) */
    config: z.record(z.string(), z.unknown()).openapi({ example: { bucket: "media" } }),
    /** Только чтение */
    readOnly: z.boolean().openapi({ example: false }),
    /** Заданы ли зашифрованные креды */
    hasSecrets: z.boolean().openapi({ example: true }),
    /** Дата создания ISO */
    createdAt: z.string().nullable().openapi({ example: "2026-01-15T10:00:00.000Z" }),
  })
  .openapi("StorageConfigDto");

/** Список конфигов GET /api/storage-configs */
export const StorageConfigListSchema = z
  .array(StorageConfigDtoSchema)
  .openapi("StorageConfigList");

/** Тело POST /api/storage-configs */
export const CreateStorageConfigRequestSchema = z
  .object({
    /** Опциональный стабильный id */
    id: z.string().min(1).max(128).optional(),
    /** Имя конфига */
    name: z.string().min(1).max(200).openapi({ example: "Локальное хранилище" }),
    /** Тип бэкенда */
    backend: z.enum(["local", "s3"]).openapi({ example: "local" }),
    /** Несекретные параметры */
    config: z.record(z.string(), z.unknown()).optional().openapi({ example: { rootPath: "./uploads" } }),
    /** Access key S3 (только при backend=s3) */
    s3AccessKeyId: z.string().min(1).optional(),
    /** Secret key S3 */
    s3SecretAccessKey: z.string().min(1).optional(),
    /** Режим только чтения */
    readOnly: z.boolean().optional().default(false),
  })
  .openapi("CreateStorageConfigRequest");

/** Ошибка валидации storage-configs */
export const StorageConfigValidationErrorSchema = z
  .object({
    /** Сообщение */
    error: z.string().openapi({ example: "Некорректные данные" }),
    /** Детали Zod */
    details: z.array(z.unknown()).optional(),
  })
  .openapi("StorageConfigValidationError");
