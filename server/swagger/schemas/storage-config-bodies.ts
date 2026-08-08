/**
 * @fileoverview OpenAPI-схемы тел запросов create/update storage-configs.
 * @module server/swagger/schemas/storage-config-bodies
 */

import "./common";
import { z } from "zod";

/** Тело POST /api/storage-configs */
export const CreateStorageConfigRequestSchema = z
  .object({
    /** Опциональный стабильный id; иначе `{backend}-{uuid}` */
    id: z.string().min(1).max(128).optional().openapi({
      example: "s3-main",
      description: "Если не указан — сервер сгенерирует `local-…` / `s3-…`",
    }),
    /** Имя в UI */
    name: z.string().min(1).max(200).openapi({ example: "Основное S3" }),
    /** Тип бэкенда */
    backend: z.enum(["local", "s3"]).openapi({ example: "s3" }),
    /**
     * Несекретные параметры (полная запись объекта).
     * local: `{ "rootPath": "./uploads" }`;
     * s3: `{ "bucket": "media", "region": "ru-central1", "endpointUrl": "https://…", "forcePathStyle": true, "publicUrlBase": "https://cdn…" }`.
     */
    config: z.record(z.string(), z.unknown()).optional().openapi({
      example: {
        bucket: "media",
        region: "ru-central1",
        endpointUrl: "https://storage.example.com",
        forcePathStyle: true,
      },
    }),
    /** Access key S3 — только в запросе, в ответе не возвращается */
    s3AccessKeyId: z.string().min(1).optional().openapi({
      example: "AKIA…",
      description: "Нужен вместе с s3SecretAccessKey при backend=s3; требует STORAGE_ENCRYPTION_KEY",
    }),
    /** Secret key S3 — только в запросе, в ответе не возвращается */
    s3SecretAccessKey: z.string().min(1).optional().openapi({
      example: "wJalr…",
      description: "Шифруется в secretsEnc; наружу никогда не отдаётся",
    }),
    /** Режим только чтения */
    readOnly: z.boolean().optional().default(false).openapi({ example: false }),
  })
  .openapi("CreateStorageConfigRequest");

/** Тело PATCH /api/storage-configs/{id} (частичное) */
export const UpdateStorageConfigRequestSchema = z
  .object({
    name: z.string().min(1).max(200).optional().openapi({ example: "Бэкапы S3" }),
    /** Полная замена объекта config (не merge полей) */
    config: z.record(z.string(), z.unknown()).optional(),
    readOnly: z.boolean().optional(),
    /**
     * `true` — сделать активным для новых загрузок и снять isActive у остальных.
     * `false` — просто выключить флаг у этого конфига (не назначает другое активным).
     */
    isActive: z.boolean().optional().openapi({ example: true }),
    s3AccessKeyId: z.string().min(1).optional(),
    s3SecretAccessKey: z.string().min(1).optional(),
  })
  .openapi("UpdateStorageConfigRequest");

/** Path-параметр id конфига */
export const StorageConfigIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "local-default",
    description: "ID записи storage_configs",
  }),
});
