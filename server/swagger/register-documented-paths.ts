/**
 * @fileoverview Детально описанные OpenAPI paths (эталонные эндпоинты)
 * @module server/swagger/register-documented-paths
 */

import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "./schemas/common";
import {
  AuthErrorSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "./schemas/common";
import {
  GetTelegramUserResponseSchema,
  TelegramAuthRequestSchema,
  TelegramAuthResponseSchema,
} from "./schemas/auth";
import { HealthResponseSchema } from "./schemas/health";
import {
  BotProjectSchema,
  CreateProjectRequestSchema,
  CreateProjectUnauthorizedSchema,
} from "./schemas/projects";
import { registerAgentTokenPaths } from "./paths/agent-token-paths";
import { registerConfigSetupPaths } from "./paths/config-setup-paths";
import { registerDatabasePaths } from "./paths/database-paths";
import { registerProjectsPaths } from "./paths/projects-paths";
import { registerStorageConfigPaths } from "./paths/storage-config-paths";

/** Реестр Zod-схем и paths для генерации OpenAPI */
export const documentedRegistry = new OpenAPIRegistry();

documentedRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "connect.sid",
  description: "Сессия после POST /api/auth/telegram",
});

documentedRegistry.registerComponent("securitySchemes", "agentToken", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "PAT",
  description: "Персональный токен агента (MCP/CLI)",
});

const cookieSecurity = [{ cookieAuth: [] as string[] }];
const publicSecurity: never[] = [];

documentedRegistry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["health"],
  summary: "Healthcheck компонентов",
  description: "Публичный эндпоинт. Проверяет готовность БД, шаблонов и Telegram-клиента.",
  security: publicSecurity,
  responses: {
    200: {
      description: "Статус компонентов",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "post",
  path: "/api/auth/telegram",
  tags: ["auth"],
  summary: "Вход через Telegram Login Widget",
  description: "Публичный. Создаёт/обновляет пользователя и устанавливает session cookie.",
  security: publicSecurity,
  request: {
    body: { content: { "application/json": { schema: TelegramAuthRequestSchema } } },
  },
  responses: {
    200: {
      description: "Авторизация успешна, cookie установлена",
      content: { "application/json": { schema: TelegramAuthResponseSchema } },
    },
    400: {
      description: "Не передан id",
      content: { "application/json": { schema: AuthErrorSchema } },
    },
    401: {
      description: "Невалидный id_token",
      content: { "application/json": { schema: AuthErrorSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "get",
  path: "/api/auth/telegram/user/{id}",
  tags: ["auth"],
  summary: "Получить пользователя Telegram по ID",
  description: "Публичный. Возвращает данные из таблицы telegram_users.",
  security: publicSecurity,
  request: {
    params: z.object({
      /** Telegram user id */
      id: z.string().openapi({ example: "123456789", description: "Telegram user id" }),
    }),
  },
  responses: {
    200: {
      description: "Пользователь найден",
      content: { "application/json": { schema: GetTelegramUserResponseSchema } },
    },
    400: {
      description: "Невалидный id",
      content: { "application/json": { schema: AuthErrorSchema } },
    },
    404: {
      description: "Пользователь не найден",
      content: { "application/json": { schema: AuthErrorSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "post",
  path: "/api/projects",
  tags: ["projects"],
  summary: "Создать проект",
  description: "Требует авторизацию. ownerId берётся из сессии, не из тела запроса.",
  security: cookieSecurity,
  request: {
    body: { content: { "application/json": { schema: CreateProjectRequestSchema } } },
  },
  responses: {
    201: {
      description: "Проект создан",
      content: { "application/json": { schema: BotProjectSchema } },
    },
    400: {
      description: "Ошибка валидации Zod",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
    401: {
      description: "Гость без авторизации",
      content: { "application/json": { schema: CreateProjectUnauthorizedSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "get",
  path: "/api/projects/{id}",
  tags: ["projects"],
  summary: "Получить проект по ID",
  description: "Требует доступ к проекту (владелец или collaborator).",
  security: cookieSecurity,
  request: {
    params: z.object({
      /** ID проекта */
      id: z.string().openapi({ example: "42", description: "ID проекта" }),
    }),
  },
  responses: {
    200: {
      description: "Данные проекта",
      content: { "application/json": { schema: BotProjectSchema } },
    },
    400: {
      description: "id не число",
      content: { "application/json": { schema: MessageErrorSchema } },
    },
    401: {
      description: "Не авторизован",
      content: { "application/json": { schema: UnauthorizedSchema } },
    },
    404: {
      description: "Проект не найден",
      content: { "application/json": { schema: MessageErrorSchema } },
    },
  },
});

registerAgentTokenPaths(documentedRegistry, cookieSecurity);
registerProjectsPaths(documentedRegistry, cookieSecurity);
registerConfigSetupPaths(documentedRegistry, publicSecurity);
registerStorageConfigPaths(documentedRegistry, cookieSecurity);
registerDatabasePaths(documentedRegistry, cookieSecurity);
