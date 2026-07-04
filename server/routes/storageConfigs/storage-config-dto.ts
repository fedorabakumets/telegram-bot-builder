/**
 * @fileoverview DTO и zod-схемы для CRUD-эндпоинтов `/api/storage-configs`.
 *
 * Главное правило безопасности (Req 11.5): наружу НИКОГДА не отдаются
 * зашифрованные креды (`secretsEnc`) и тем более расшифрованные значения —
 * только булев флаг `hasSecrets`, сообщающий, заданы ли секреты у конфига.
 *
 * Здесь же сосредоточена валидация тела запросов на создание/обновление
 * (zod), чтобы хендлеры оставались тонкими.
 * @module server/routes/storageConfigs/storage-config-dto
 */

import { z } from "zod";

import type { StorageConfig } from "@shared/schema";

/** Безопасное представление конфига хранилища (без секретов) */
export interface StorageConfigDto {
  /** Стабильный идентификатор конфига (storage_configs.id) */
  id: string;
  /** Человекочитаемое имя */
  name: string;
  /** Тип бэкенда: "local" | "s3" */
  backend: string;
  /** Активно ли для новых загрузок */
  isActive: boolean;
  /** Несекретные параметры (rootPath / endpoint+bucket и т.п.) */
  config: Record<string, unknown>;
  /** Только чтение (нельзя выбрать целью записи) */
  readOnly: boolean;
  /** Заданы ли секретные креды (без раскрытия значений) */
  hasSecrets: boolean;
  /** Дата создания (ISO) либо null */
  createdAt: string | null;
}

/**
 * Преобразует строку `storage_configs` в безопасный DTO без секретов.
 * @param row - Запись конфигурации хранилища из БД
 * @returns DTO без полей `secretsEnc`/кредов, с флагом `hasSecrets`
 */
export function toStorageConfigDto(row: StorageConfig): StorageConfigDto {
  return {
    id: row.id,
    name: row.name,
    backend: row.backend,
    isActive: row.isActive,
    config: (row.config ?? {}) as Record<string, unknown>,
    readOnly: row.readOnly,
    hasSecrets: typeof row.secretsEnc === "string" && row.secretsEnc.length > 0,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

/** Схема несекретных параметров конфига (свободный объект) */
const configSchema = z.record(z.string(), z.unknown());

/** Схема валидации тела запроса на создание конфига хранилища (Req 11.3, 11.4) */
export const createStorageConfigSchema = z
  .object({
    /** Необязательный стабильный id (иначе будет сгенерирован) */
    id: z.string().min(1).max(128).optional(),
    /** Имя конфига */
    name: z.string().min(1, "Имя обязательно").max(200),
    /** Тип бэкенда */
    backend: z.enum(["local", "s3"]),
    /** Несекретные параметры */
    config: configSchema.default({}),
    /** Access key S3 (только при создании/смене) */
    s3AccessKeyId: z.string().min(1).optional(),
    /** Secret key S3 (только при создании/смене) */
    s3SecretAccessKey: z.string().min(1).optional(),
    /** Только чтение */
    readOnly: z.boolean().optional().default(false),
  })
  .strict();

/** Схема валидации тела запроса на обновление конфига (PATCH, частичная) */
export const updateStorageConfigSchema = z
  .object({
    /** Новое имя */
    name: z.string().min(1).max(200).optional(),
    /** Новые несекретные параметры (полная замена объекта config) */
    config: configSchema.optional(),
    /** Сменить режим только-чтения */
    readOnly: z.boolean().optional(),
    /** Сделать активным (true → снять активность у остальных) */
    isActive: z.boolean().optional(),
    /** Новый access key S3 (только при смене кредов) */
    s3AccessKeyId: z.string().min(1).optional(),
    /** Новый secret key S3 (только при смене кредов) */
    s3SecretAccessKey: z.string().min(1).optional(),
  })
  .strict();

/** Тип валидированного тела создания конфига */
export type CreateStorageConfigInput = z.infer<typeof createStorageConfigSchema>;

/** Тип валидированного тела обновления конфига */
export type UpdateStorageConfigInput = z.infer<typeof updateStorageConfigSchema>;
