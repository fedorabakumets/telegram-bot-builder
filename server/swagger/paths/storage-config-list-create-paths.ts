/**
 * @fileoverview OpenAPI paths: GET/POST `/api/storage-configs`.
 * @module server/swagger/paths/storage-config-list-create-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SetupRequiredSchema, UnauthorizedSchema } from "../schemas/common";
import { CreateStorageConfigRequestSchema } from "../schemas/storage-config-bodies";
import {
  StorageConfigDtoSchema,
  StorageConfigErrorSchema,
  StorageConfigListSchema,
  StorageConfigValidationErrorSchema,
} from "../schemas/storage-configs";
import {
  CREATE_LOCAL_EXAMPLE,
  CREATE_S3_EXAMPLE,
  STORAGE_CONFIG_LIST_EXAMPLE,
} from "./storage-config-examples";

/**
 * Регистрирует list + create для реестра хранилищ.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerStorageConfigListCreatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/storage-configs",
    tags: ["storage-configs"],
    summary: "Список конфигов хранилищ",
    description:
      "Реестр бэкендов медиа: **local** (папка) и **S3**/MinIO.\n\n" +
      "**Зачем:** UI «Файлы» → «Хранилища»; фильтр файлов; новые загрузки → активное " +
      "writable (`isActive=true`).\n\n" +
      "**Отдаёт:** `id`, `name`, `backend`, `isActive`, `config` (несекретные параметры), " +
      "`readOnly`, `hasSecrets`, `createdAt`.\n\n" +
      "**Не отдаёт:** `secretsEnc`, access/secret keys — только булев `hasSecrets`.\n\n" +
      "**Авторизация:** cookie или Bearer PAT. Клиент: `useStorageConfigs`.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Все записи storage_configs без секретов",
        content: {
          "application/json": {
            schema: StorageConfigListSchema,
            examples: {
              mixed: { summary: "Local активный + S3", value: STORAGE_CONFIG_LIST_EXAMPLE },
            },
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка чтения БД",
        content: {
          "application/json": {
            schema: StorageConfigErrorSchema,
            example: { error: "Не удалось получить список хранилищ" },
          },
        },
      },
      503: {
        description: "Приложение не настроено (setupGuard)",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/storage-configs",
    tags: ["storage-configs"],
    summary: "Создать конфиг хранилища",
    description:
      "Регистрирует **local** или **S3** с `isActive=false` (активация — `PATCH`).\n\n" +
      "**S3:** `s3AccessKeyId` + `s3SecretAccessKey` → шифрование в `secretsEnc` " +
      "(нужен `STORAGE_ENCRYPTION_KEY`). В ответе секретов нет (`hasSecrets`).\n\n" +
      "После успеха — `StorageRegistry.reload()`. **Не отдаёт** ключи и `secretsEnc`.",
    security: cookieSecurity,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateStorageConfigRequestSchema,
            examples: {
              local: { summary: "Локальная папка", value: CREATE_LOCAL_EXAMPLE },
              s3: { summary: "S3 / MinIO", value: CREATE_S3_EXAMPLE },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Конфиг создан (DTO без секретов)",
        content: { "application/json": { schema: StorageConfigDtoSchema } },
      },
      400: {
        description: "Валидация или нет STORAGE_ENCRYPTION_KEY",
        content: { "application/json": { schema: StorageConfigValidationErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      409: {
        description: "Конфиг с таким id уже существует",
        content: {
          "application/json": {
            schema: StorageConfigErrorSchema,
            example: { error: 'Хранилище с id "s3-main" уже существует' },
          },
        },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
