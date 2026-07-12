/**
 * @fileoverview OpenAPI paths для реестра внешних хранилищ
 * @module server/swagger/paths/storage-config-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ErrorBodySchema } from "../schemas/common";
import {
  CreateStorageConfigRequestSchema,
  StorageConfigDtoSchema,
  StorageConfigListSchema,
  StorageConfigValidationErrorSchema,
} from "../schemas/storage-configs";

/**
 * Регистрирует OpenAPI paths CRUD реестра storage-configs (list + create).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement
 * @returns void
 */
export function registerStorageConfigPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/storage-configs",
    tags: ["storage-configs"],
    summary: "Список конфигов хранилищ",
    description:
      "Все записи storage_configs в безопасном DTO: без secretsEnc и расшифрованных кредов, " +
      "только флаг hasSecrets.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Массив конфигов",
        content: { "application/json": { schema: StorageConfigListSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/storage-configs",
    tags: ["storage-configs"],
    summary: "Создать конфиг хранилища",
    description:
      "Регистрирует local или S3 бэкенд. Креды S3 шифруются в secretsEnc. " +
      "После создания перестраивается storage registry.",
    security: cookieSecurity,
    request: {
      body: { content: { "application/json": { schema: CreateStorageConfigRequestSchema } } },
    },
    responses: {
      201: {
        description: "Конфиг создан",
        content: { "application/json": { schema: StorageConfigDtoSchema } },
      },
      400: {
        description: "Невалидные данные или нет STORAGE_ENCRYPTION_KEY",
        content: { "application/json": { schema: StorageConfigValidationErrorSchema } },
      },
      409: {
        description: "Конфиг с таким id уже существует",
        content: { "application/json": { schema: ErrorBodySchema } },
      },
    },
  });
}
