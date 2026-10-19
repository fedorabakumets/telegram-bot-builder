/**
 * @fileoverview OpenAPI: GET /api/auth/me, POST logout (+ алиас).
 * @module server/swagger/paths/auth-session-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { AuthErrorSchema } from "../schemas/common";
import {
  LogoutCookiesSchema,
  LogoutResponseSchema,
  MeCookiesSchema,
  MeErrorResponseSchema,
  MeResponseSchema,
} from "../schemas/auth";
import {
  LOGOUT_OK_EXAMPLE,
  ME_GUEST_EXAMPLE,
  ME_OK_EXAMPLE,
} from "./auth-examples";

/**
 * Регистрирует me / logout / telegram/logout.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security (публичные)
 * @returns void
 */
export function registerAuthSessionPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  const sessionSecurity = [{ cookieAuth: [] as string[] }, { agentToken: [] as string[] }];
  registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    tags: ["auth"],
    summary: "Текущий пользователь сессии",
    description:
      "Источник правды после reload страницы. **Не** меняет сессию.\n\n" +
      "- Есть cookie `connect.sid` + `telegramUser` → `{ user: {...} }`\n" +
      "- Нет cookie / гость → **всё равно 200** `{ user: null }` (это **не** 401)\n\n" +
      "**Параметры:** path/query/body **нет**. Единственный вход — опциональная cookie " +
      "`connect.sid` (см. Parameters).\n\n" +
      "`/api/auth/*` исключены из setupGuard — **503 не бывает**.\n\n" +
      "**Клиент:** `useTelegramAuth` (React Query `['/api/auth/me']`).\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/auth/me -b cookies.txt\n" +
      "```",
    security: publicSecurity,
    request: {
      cookies: MeCookiesSchema,
    },
    responses: {
      200: {
        description: "Пользователь из сессии или null (гость)",
        content: {
          "application/json": {
            schema: MeResponseSchema,
            examples: {
              loggedIn: { summary: "Залогинен", value: ME_OK_EXAMPLE },
              guest: { summary: "Гость", value: ME_GUEST_EXAMPLE },
            },
          },
        },
      },
      500: {
        description: "Сбой чтения session store",
        content: {
          "application/json": {
            schema: MeErrorResponseSchema,
            example: { user: null, error: "Ошибка чтения сессии" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: ["auth"],
    summary: "Выход из Studio-сессии",
    description:
      "Уничтожает серверную сессию и очищает cookie `connect.sid`.\n\n" +
      "Cookie **опциональна**: без `connect.sid` ответ всё равно **200** " +
      "`{ success: true }` (идемпотентно — `destroySession` no-op при отсутствии сессии).\n\n" +
      "Rate limit: общий лимит mutating auth. `/api/auth/*` вне setupGuard — **503 не бывает**.\n\n" +
      "**Клиент:** кнопка «Выйти» в шапке/сайдбаре.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/auth/logout -b cookies.txt -c cookies.txt\n" +
      "```",
    security: publicSecurity,
    request: {
      cookies: LogoutCookiesSchema,
    },
    responses: {
      200: {
        description: "Сессия уничтожена (или уже не было сессии)",
        content: {
          "application/json": {
            schema: LogoutResponseSchema,
            example: LOGOUT_OK_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка destroy session",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Ошибка выхода" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/telegram/logout",
    tags: ["auth"],
    summary: "Выход (алиас logout)",
    description:
      "Тот же обработчик, что `POST /api/auth/logout` (включая идемпотентность без cookie). " +
      "Оставлен для совместимости со старым клиентом.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/auth/telegram/logout -b cookies.txt -c cookies.txt\n" +
      "```",
    security: publicSecurity,
    request: {
      cookies: LogoutCookiesSchema,
    },
    responses: {
      200: {
        description: "Сессия уничтожена (или уже не было сессии)",
        content: {
          "application/json": {
            schema: LogoutResponseSchema,
            example: LOGOUT_OK_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка destroy session",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Ошибка выхода" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/profile/sessions",
    tags: ["auth"],
    summary: "Список активных сессий",
    description: "Возвращает активные сессии текущего пользователя. Внутренний connect.sid не раскрывается.",
    security: sessionSecurity,
    responses: {
      200: { description: "Список активных сессий" },
      401: { description: "Требуется авторизация" },
      503: { description: "Redis временно недоступен" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/profile/sessions/{id}",
    tags: ["auth"],
    summary: "Завершить активную сессию",
    description: "Завершает выбранную сессию текущего пользователя. Текущую сессию завершить этим методом нельзя.",
    security: sessionSecurity,
    responses: {
      200: { description: "Сессия завершена" },
      401: { description: "Требуется авторизация" },
      404: { description: "Сессия не найдена или является текущей" },
      503: { description: "Redis временно недоступен" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/profile/sessions",
    tags: ["auth"],
    summary: "Завершить остальные сессии",
    description: "Завершает все сессии текущего пользователя, кроме текущей.",
    security: sessionSecurity,
    responses: {
      200: { description: "Остальные сессии завершены" },
      401: { description: "Требуется авторизация" },
      503: { description: "Redis временно недоступен" },
    },
  });
}
