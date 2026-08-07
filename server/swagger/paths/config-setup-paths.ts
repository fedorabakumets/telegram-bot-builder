/**
 * @fileoverview OpenAPI paths для публичной конфигурации и setup wizard
 * @module server/swagger/paths/config-setup-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  PublicConfigSchema,
  SetupErrorSchema,
  SetupPayloadSchema,
  SetupStatusSchema,
  SetupSuccessSchema,
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
      "Публичный, **без сессии**. Показывает, пройден ли setup wizard.\n\n" +
      "**Клиент:** `SetupGuard` → `useSetupStatus()` при старте приложения.\n\n" +
      "`configured=false` в production (все три ключа в `app_settings`: client_id, client_secret, bot_username) — " +
      "UI редиректит на `/setup`, `setupGuard` отвечает 503 на остальные `/api/*`.\n\n" +
      "В `NODE_ENV=development` или при `SKIP_AUTH !== false` всегда `configured=true` (dev bypass).",
    security: publicSecurity,
    responses: {
      200: {
        description: "configured=true — приложение настроено",
        content: { "application/json": { schema: SetupStatusSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/setup",
    tags: ["setup"],
    summary: "Первоначальная настройка приложения",
    description:
      "Публичный, **без сессии**. Однократная инициализация: сохраняет Telegram credentials в `app_settings`.\n\n" +
      "**Клиент:** форма на `/setup` → `POST /api/setup` → редирект на `/projects`.\n\n" +
      "`telegram_client_secret` сохраняется для проверки `isConfigured()`; Login Widget верифицирует hash от Telegram, " +
      "не client_secret. Изменение после setup — через `.env` / будущий `/admin/settings`.\n\n" +
      "Опциональный `telegramBotToken` нужен для Mini App auth (`POST /api/auth/telegram/miniapp`). " +
      "Если не передан — существующий token в БД не удаляется.",
    security: publicSecurity,
    request: {
      body: {
        content: { "application/json": { schema: SetupPayloadSchema } },
      },
    },
    responses: {
      201: {
        description: "Настройки сохранены",
        content: { "application/json": { schema: SetupSuccessSchema } },
      },
      400: {
        description: "Невалидное тело запроса",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
      409: {
        description: "Приложение уже настроено",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
      500: {
        description: "Внутренняя ошибка сервера",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
    },
  });
}
