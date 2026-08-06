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
  LogoutResponseSchema,
  MeResponseSchema,
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
import { registerBotUsersPaths } from "./paths/bot-users-paths";
import { registerBotTokensPaths } from "./paths/bot-tokens-paths";
import { registerBotStartOfflinePaths } from "./paths/bot-runtime-start-offline-paths";
import { registerConfigSetupPaths } from "./paths/config-setup-paths";
import { registerDatabasePaths } from "./paths/database-paths";
import { registerProjectsPaths } from "./paths/projects-paths";
import { registerStorageConfigPaths } from "./paths/storage-config-paths";
import { registerWorkerPaths } from "./paths/worker-paths";
import { registerWebhookPaths } from "./paths/webhook-paths";

/** Реестр Zod-схем и paths для генерации OpenAPI */
export const documentedRegistry = new OpenAPIRegistry();

documentedRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "connect.sid",
  description: "Сессия после успешного login (POST /api/auth/telegram или miniapp/dev-login)",
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
  method: "get",
  path: "/api/auth/me",
  tags: ["auth"],
  summary: "Текущий пользователь сессии",
  description:
    "Публичный (cookie опциональна). Клиент вызывает при каждой загрузке страницы. " +
    "Не меняет сессию. Без cookie или без telegramUser возвращает { user: null }.",
  security: publicSecurity,
  responses: {
    200: {
      description: "Пользователь из сессии или null",
      content: { "application/json": { schema: MeResponseSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["auth"],
  summary: "Выход из Studio-сессии",
  description:
    "Публичный. Уничтожает серверную сессию и очищает cookie connect.sid. " +
    "Алиас: POST /api/auth/telegram/logout.",
  security: publicSecurity,
  responses: {
    200: {
      description: "Сессия уничтожена",
      content: { "application/json": { schema: LogoutResponseSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "post",
  path: "/api/auth/telegram",
  tags: ["auth"],
  summary: "Вход / смена аккаунта через Telegram Login Widget",
  description:
    "Публичный. Только реальный login (не restore после reload). " +
    "Создаёт/обновляет пользователя и устанавливает session cookie. " +
    "Повторный вызов с другим id = смена аккаунта: сервер регенерирует session, " +
    "в ответе switched=true. В production без SKIP_AUTH поле id_token обязательно.",
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
      description: "Требуется или невалиден id_token / proof",
      content: { "application/json": { schema: AuthErrorSchema } },
    },
    429: {
      description: "Rate limit auth",
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
registerBotUsersPaths(documentedRegistry, cookieSecurity);
registerBotTokensPaths(documentedRegistry, cookieSecurity);
registerBotStartOfflinePaths(documentedRegistry, cookieSecurity);
registerProjectsPaths(documentedRegistry, cookieSecurity);
registerConfigSetupPaths(documentedRegistry, publicSecurity);
registerStorageConfigPaths(documentedRegistry, cookieSecurity);
registerWorkerPaths(documentedRegistry, cookieSecurity);
registerWebhookPaths(documentedRegistry, publicSecurity);
registerDatabasePaths(documentedRegistry, cookieSecurity);
