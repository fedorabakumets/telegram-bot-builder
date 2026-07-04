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
  auth: "Аутентификация через Telegram и dev-login",
  health: "Healthcheck и готовность компонентов",
  setup: "Первоначальная настройка приложения",
  config: "Публичная конфигурация клиента",
  projects: "Проекты, версии, экспорт и дублирование",
  templates: "Шаблоны ботов",
  media: "Загрузка и управление медиафайлами",
  bots: "Управление запуском ботов",
  tokens: "Токены ботов и настройки запуска",
  users: "Пользователи ботов и статистика",
  database: "Таблицы контента проекта",
  "storage-configs": "Реестр внешних хранилищ",
  "agent-tokens": "Персональные токены агента (MCP/CLI)",
  "telegram-auth": "Авторизация Telegram Client API (userbot)",
  webhook: "Webhook-эндпоинты Telegram",
  broadcasts: "Рассылки",
  groups: "Telegram-группы и модерация",
  github: "GitHub commit/push",
  "google-sheets": "Интеграция Google Sheets",
  "user-ids": "Идентификаторы пользователей",
  root: "Корень API",
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
  if (segments.length === 1) return "root";
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
