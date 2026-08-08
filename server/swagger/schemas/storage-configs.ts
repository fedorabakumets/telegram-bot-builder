/**
 * @fileoverview OpenAPI-схемы реестра внешних хранилищ (`/api/storage-configs`).
 * Безопасный DTO без `secretsEnc`/кредов — только флаг `hasSecrets`.
 * @module server/swagger/schemas/storage-configs
 */

import "./common";
import { z } from "zod";

/** Безопасный DTO конфига хранилища (без секретов) */
export const StorageConfigDtoSchema = z
  .object({
    /** Стабильный ID (`storage_configs.id`, ссылка из `media_files`) */
    id: z.string().openapi({ example: "local-default" }),
    /** Человекочитаемое имя в UI «Хранилища» */
    name: z.string().openapi({ example: "Локально: uploads" }),
    /** Тип бэкенда */
    backend: z.enum(["local", "s3"]).openapi({ example: "local" }),
    /** Активно для новых загрузок (ровно одно на инстанс) */
    isActive: z.boolean().openapi({ example: true }),
    /**
     * Несекретные параметры.
     * local: `{ rootPath }`;
     * s3: `{ endpointUrl?, region?, bucket, forcePathStyle?, publicUrlBase? }`.
     * Access/secret keys сюда не попадают.
     */
    config: z.record(z.string(), z.unknown()).openapi({
      example: { rootPath: "uploads" },
    }),
    /** Только чтение — нельзя выбрать целью записи */
    readOnly: z.boolean().openapi({ example: false }),
    /** Заданы ли зашифрованные креды S3 (значения не раскрываются) */
    hasSecrets: z.boolean().openapi({ example: false }),
    /** Дата создания ISO или null */
    createdAt: z.string().nullable().openapi({ example: "2026-01-15T10:00:00.000Z" }),
  })
  .openapi("StorageConfigDto");

/** Список конфигов GET /api/storage-configs */
export const StorageConfigListSchema = z
  .array(StorageConfigDtoSchema)
  .openapi("StorageConfigList");

/** Простая ошибка storage-configs (`error`) */
export const StorageConfigErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Хранилище не найдено" }),
  })
  .openapi("StorageConfigError");

/** Ошибка валидации тела create/update */
export const StorageConfigValidationErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Некорректные данные" }),
    details: z.array(z.unknown()).optional(),
  })
  .openapi("StorageConfigValidationError");

/** Конфликт удаления: на хранилище ещё есть файлы */
export const StorageConfigDeleteConflictSchema = z
  .object({
    error: z.string().openapi({ example: "Нельзя удалить хранилище: на нём есть файлы" }),
    filesCount: z.number().int().openapi({ example: 12 }),
  })
  .openapi("StorageConfigDeleteConflict");

/** Успешное удаление DELETE /api/storage-configs/{id} */
export const StorageConfigDeleteOkSchema = z
  .object({
    ok: z.literal(true),
    id: z.string().openapi({ example: "s3-backup" }),
  })
  .openapi("StorageConfigDeleteOk");

/** Результат POST /api/storage-configs/{id}/test */
export const StorageConfigTestResultSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: "Папка доступна на запись: uploads" }),
  })
  .openapi("StorageConfigTestResult");
