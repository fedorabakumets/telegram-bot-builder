/**
 * @fileoverview Сбор HTTP-маршрутов Express для генерации OpenAPI paths
 * @module server/swagger/collect-routes
 */

import type { Express } from "express";
import listEndpoints from "express-list-endpoints";

/** HTTP-метод и путь одного эндпоинта */
export interface CollectedRoute {
  /** HTTP-метод в верхнем регистре */
  method: string;
  /** Полный путь, например /api/projects/{id} */
  path: string;
  /** Тег OpenAPI для группировки в Swagger UI */
  tag: string;
}

/** Описания тегов OpenAPI по префиксу /api/{segment} */
const TAG_DESCRIPTIONS: Record<string, string> = {
  auth:
    "Вход в Studio: Telegram Widget, Mini App initData, dev-login по ID; " +
    "сессия (`/me`, logout). Публичные; cookie `connect.sid` после успешного login. " +
    "Режим входа — `/admin/settings` (dev_login | telegram_widget). Не путать с `/admin/login` и agent PAT.",
  health:
    "Публичный healthcheck: GET JSON (database/templates/ready), HEAD → 204. " +
    "ready === database; templates независимо. Без Redis в ответе.",
  setup: "Первоначальная настройка приложения",
  config:
    "Bootstrap экрана входа Studio (до сессии): Client ID / bot username / skipAuth. " +
    "Не конфиг бота — только что показать на AuthScreen (widget vs dev-login).",
  projects: "Проекты, версии, экспорт и дублирование",
  templates:
    "Библиотека готовых сценариев (`bot_templates`). UI: «Сценарии». " +
    "CRUD + use; доступ canViewOrUseTemplate. " +
    "featured и seed — только /admin/api/templates/*. " +
    "Не путать с lib/templates/ (Jinja2).",
  media:
    "Медиа проекта: upload/list/search/download URL, CRUD по id. " +
    "Auth: requireProjectAccess | requireMediaOwnership | requireMediaFileOwnership. " +
    "upload-from-url проверяет hasProjectAccess.",
  "bot-logs":
    "Одна строка лога бота по ID (permalink терминала `?log=`). " +
    "Доступ по владению проектом. Live-список логов — другие эндпоинты/WebSocket.",
  launch:
    "Логи одного запуска бота (bot_launch_history → bot_logs). " +
    "Доступ по проекту; пустой launch → 404.",
  bot:
    "Bot Manager API (`/api/bot/*`): проекты, токены, users, env, collaborators. " +
    "Auth: session cookie или Bearer PAT; actor = свой id, либо `telegram_id` " +
    "при scope `bot_manager` (`STUDIO_BOT_MANAGER_TOKEN`). " +
    "См. `docs/features/bot-manager-api-auth.md`.",
  bots:
    "Инстансы ботов (GET /api/bots без секрета token) и массовый старт офлайн " +
    "(POST …/bot/start-offline-all). Доступ по владельцу/проекту.",
  tokens:
    "Токены ботов, retention и reveal env (`…/env-variables/{id}/reveal` — сырой секрет, " +
    "только владелец/collaborator). Список env секреты маскирует.",
  users: "Пользователи ботов и статистика",
  database:
    "Пользовательские таблицы проекта (bot_tables). Сейчас в OpenAPI: список GET …/tables. " +
    "Доступ requireProjectAccess.",
  "storage-configs":
    "Реестр медиа-хранилищ (local / S3): список, создание, обновление, удаление, тест связности. " +
    "Секреты наружу не отдаются — только hasSecrets. UI: вкладка «Файлы» → «Хранилища».",
  "agent-tokens":
    "Персональные токены агента (PAT) для MCP/CLI: список, создание, отзыв. " +
    "Секрет `mcp_…` отдаётся один раз при POST. Авторизация: session cookie или Bearer PAT.",
  workers: "Worker Pool — Python-воркеры и статистика запущенных ботов",
  server: "Серверные переменные окружения (whitelist ключей для подстановки в env бота)",
  webhook: "Входящие webhook-апдейты Telegram (публичный прокси в Python бота)",
  broadcasts: "Рассылки",
  groups: "Telegram-группы и модерация",
};

/**
 * Преобразует Express-путь (:id) в OpenAPI-формат ({id}).
 * @param path - Путь из express-list-endpoints
 * @returns Путь в формате OpenAPI
 */
function toOpenApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

/**
 * Определяет тег OpenAPI по URL.
 * @param path - Полный путь эндпоинта
 * @returns Имя тега
 */
function inferTag(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] !== "api") return "other";
  return segments[1] ?? "other";
}

/**
 * Собирает все API-маршруты приложения для документации OpenAPI.
 * @param app - Экземпляр Express после регистрации всех роутов
 * @returns Список маршрутов с тегами
 */
export function collectApiRoutes(app: Express): CollectedRoute[] {
  const endpoints = listEndpoints(app);
  const routes: CollectedRoute[] = [];

  for (const endpoint of endpoints) {
    if (!endpoint.path.startsWith("/api")) continue;

    const openApiPath = toOpenApiPath(endpoint.path);
    const tag = inferTag(endpoint.path);

    for (const method of endpoint.methods) {
      if (method === "HEAD") continue;
      routes.push({ method: method.toUpperCase(), path: openApiPath, tag });
    }
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

/**
 * Возвращает описания тегов для OpenAPI document.
 * @param routes - Собранные маршруты
 * @returns Массив тегов с описаниями
 */
export function buildOpenApiTags(routes: CollectedRoute[]): Array<{ name: string; description: string }> {
  const tagNames = [...new Set(routes.map((route) => route.tag))].sort();
  return tagNames.map((name) => ({
    name,
    description: TAG_DESCRIPTIONS[name] ?? `Эндпоинты /api/${name}`,
  }));
}
