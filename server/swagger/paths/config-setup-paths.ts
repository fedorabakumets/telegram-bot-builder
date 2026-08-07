/**
 * @fileoverview OpenAPI paths для публичной конфигурации и setup status
 * @module server/swagger/paths/config-setup-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  PublicConfigSchema,
  SetupBootstrapSchema,
  SetupStatusSchema,
} from "../schemas/config";

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
    description:
      "Публичный, **без сессии**. Показывает, завершён ли platform setup.\n\n" +
      "**Клиент:** `SetupGuard` → bootstrap/status при старте.\n\n" +
      "`configured=false` — UI редиректит в `/admin`, `setupGuard` отвечает 503 на остальные `/api/*`.\n\n" +
      "При dev-login в `/admin/settings` (`auth_login_mode=dev_login`) — `configured=true` без BotFather.",
    security: publicSecurity,
    responses: {
      200: {
        description: "configured=true — приложение настроено",
        content: { "application/json": { schema: SetupStatusSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/setup/bootstrap",
    tags: ["setup"],
    summary: "Bootstrap first-run (configured + adminEnabled)",
    description:
      "Публичный, **без сессии**. Для клиента при first-run: `configured` и доступность `/admin` (`adminEnabled`).\n\n" +
      "Настройка платформы — через `/admin/login` → `/admin/settings` (не публичный wizard).",
    security: publicSecurity,
    responses: {
      200: {
        description: "Bootstrap статус",
        content: { "application/json": { schema: SetupBootstrapSchema } },
      },
    },
  });
}
