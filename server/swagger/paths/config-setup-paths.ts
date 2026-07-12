/**
 * @fileoverview OpenAPI paths для публичной конфигурации и setup wizard
 * @module server/swagger/paths/config-setup-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PublicConfigSchema, SetupStatusSchema } from "../schemas/config";

/**
 * Регистрирует публичные paths конфигурации и статуса setup.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security (публичные эндпоинты)
 * @returns void
 */
export function registerConfigSetupPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "get",
    path: "/api/config",
    tags: ["config"],
    summary: "Публичная конфигурация клиента",
    description:
      "Отдаёт Telegram Client ID, имя бота и флаг skipAuth для Login Widget. " +
      "Читает app_settings с fallback на process.env.",
    security: publicSecurity,
    responses: {
      200: {
        description: "Публичные параметры для фронтенда",
        content: { "application/json": { schema: PublicConfigSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/setup/status",
    tags: ["setup"],
    summary: "Статус первоначальной настройки",
    description: "Публичный. Показывает, пройден ли setup wizard (telegram credentials в БД).",
    security: publicSecurity,
    responses: {
      200: {
        description: "configured=true — приложение настроено",
        content: { "application/json": { schema: SetupStatusSchema } },
      },
    },
  });
}
