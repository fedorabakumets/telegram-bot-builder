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
    summary: "Bootstrap экрана входа Studio",
    description:
      "Публичный срез настроек **для UI до логина** (сессия не нужна).\n\n" +
      "Зачем: фронт (`useAppConfig` → `AuthScreen` / Login Widget) должен знать, " +
      "что показать на экране входа — Telegram Login Widget, форму **dev-login** " +
      "(ввод Telegram ID без proof) или что виджет ещё не настроен. " +
      "Без этого запроса экран авторизации не собрать.\n\n" +
      "Это **не** конфиг бота и не env проекта — только параметры входа в Studio.\n\n" +
      "Поля:\n" +
      "- `telegramClientId` — Client ID Telegram Login Widget; `0` = не задан\n" +
      "- `telegramBotUsername` — username бота для виджета (без `@`); пустая строка = не задан\n" +
      "- `skipAuth` — `true` при `auth_login_mode=dev_login` (форма ID); " +
      "`false` при `telegram_widget`\n\n" +
      "Источник: `app_settings` (настраивается в `/admin/settings`), " +
      "fallback на `process.env` для старых деплоев.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/config\n" +
      "```",
    security: publicSecurity,
    responses: {
      200: {
        description: "Параметры экрана входа (без секретов)",
        content: {
          "application/json": {
            schema: PublicConfigSchema,
            example: {
              telegramClientId: 12345678,
              telegramBotUsername: "my_bot",
              skipAuth: false,
            },
          },
        },
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
