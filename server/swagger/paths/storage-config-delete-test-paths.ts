/**
 * @fileoverview OpenAPI paths: DELETE и test `/api/storage-configs/{id}`.
 * @module server/swagger/paths/storage-config-delete-test-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SetupRequiredSchema, UnauthorizedSchema } from "../schemas/common";
import { StorageConfigIdParamsSchema } from "../schemas/storage-config-bodies";
import {
  StorageConfigDeleteConflictSchema,
  StorageConfigDeleteOkSchema,
  StorageConfigErrorSchema,
  StorageConfigTestResultSchema,
} from "../schemas/storage-configs";

/**
 * Регистрирует delete и connectivity-test конфига хранилища.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerStorageConfigDeleteTestPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/storage-configs/{id}",
    tags: ["storage-configs"],
    summary: "Удалить конфиг хранилища",
    description:
      "Удаляет запись и перезагружает реестр.\n\n" +
      "**409:** есть `media_files` с этим `storageConfigId` — в теле `filesCount`.\n\n" +
      "**Отдаёт:** `{ ok: true, id }`. Объекты на диске/S3 этим вызовом не удаляются.",
    security: cookieSecurity,
    request: { params: StorageConfigIdParamsSchema },
    responses: {
      200: {
        description: "Конфиг удалён",
        content: { "application/json": { schema: StorageConfigDeleteOkSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      404: {
        description: "Хранилище не найдено",
        content: { "application/json": { schema: StorageConfigErrorSchema } },
      },
      409: {
        description: "На хранилище ещё есть файлы",
        content: { "application/json": { schema: StorageConfigDeleteConflictSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/storage-configs/{id}/test",
    tags: ["storage-configs"],
    summary: "Проверить доступность хранилища",
    description:
      "Connectivity-check **без** активации.\n\n" +
      "- **local:** папка writable или создаётся;\n" +
      "- **s3:** `HeadBucket` (fallback `ListObjectsV2`).\n\n" +
      "**200** `{ ok: true, message }` · **400** `{ ok: false, message }` (без секретов).\n" +
      "Активация — отдельно `PATCH` с `isActive: true`.",
    security: cookieSecurity,
    request: { params: StorageConfigIdParamsSchema },
    responses: {
      200: {
        description: "Хранилище доступно",
        content: {
          "application/json": {
            schema: StorageConfigTestResultSchema,
            example: { ok: true, message: "Папка доступна на запись: uploads" },
          },
        },
      },
      400: {
        description: "Проверка не прошла",
        content: {
          "application/json": {
            schema: StorageConfigTestResultSchema,
            example: { ok: false, message: "Папка недоступна и не может быть создана: …" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      404: {
        description: "Хранилище не найдено",
        content: { "application/json": { schema: StorageConfigErrorSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
