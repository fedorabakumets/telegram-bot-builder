/**
 * @fileoverview OpenAPI path: PATCH `/api/storage-configs/{id}`.
 * @module server/swagger/paths/storage-config-patch-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SetupRequiredSchema, UnauthorizedSchema } from "../schemas/common";
import {
  StorageConfigIdParamsSchema,
  UpdateStorageConfigRequestSchema,
} from "../schemas/storage-config-bodies";
import {
  StorageConfigDtoSchema,
  StorageConfigErrorSchema,
  StorageConfigValidationErrorSchema,
} from "../schemas/storage-configs";

/**
 * Регистрирует PATCH обновления конфига хранилища.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerStorageConfigPatchPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "patch",
    path: "/api/storage-configs/{id}",
    tags: ["storage-configs"],
    summary: "Обновить конфиг хранилища",
    description:
      "Частичное обновление: имя, `config` (**полная замена** объекта), `readOnly`, " +
      "креды S3, `isActive`.\n\n" +
      "**Set-active:** `isActive: true` снимает активность у остальных.\n\n" +
      "**Креды:** пара ключей перешифровывается; без полей — старые секреты не трогаются.\n\n" +
      "**Отдаёт** DTO без секретов. После успеха — `StorageRegistry.reload()`.",
    security: cookieSecurity,
    request: {
      params: StorageConfigIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateStorageConfigRequestSchema,
            examples: {
              setActive: { summary: "Сделать активным", value: { isActive: true } },
              rename: { summary: "Переименовать", value: { name: "Бэкапы S3" } },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённый DTO",
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
