/**
 * @fileoverview OpenAPI: userbot send-code / sign-in / sign-in-2fa.
 * @module server/swagger/paths/project-tokens-userbot-auth-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  UserbotAuthResultSchema,
  UserbotSendCodeRequestSchema,
  UserbotSignIn2faRequestSchema,
  UserbotSignInRequestSchema,
} from "../schemas/project-tokens-userbot";

/** Общие ошибки auth-шагов */
const AUTH_ERRORS = {
  400: {
    description: "Валидация body",
    content: { "application/json": { schema: MessageErrorSchema } },
  },
  401: {
    description: "Не авторизован",
    content: {
      "application/json": {
        schema: UnauthorizedSchema,
        example: { error: "UNAUTHORIZED" },
      },
    },
  },
  403: {
    description: "Нет владения токеном",
    content: { "application/json": { schema: ForbiddenSchema } },
  },
} as const;

/**
 * Регистрирует шаги авторизации Telethon.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerProjectTokensUserbotAuthPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const auth = "**Auth:** `requireTokenOwnership`.\n\n";

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/tokens/{tokenId}/userbot/send-code",
    tags: ["project-tokens"],
    summary: "Userbot auth: отправить код",
    description:
      "Шаг 1: `{ apiId, apiHash, phone }` → Python `userbotAuth`.\n\n" +
      auth +
      "```bash\ncurl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/send-code \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"apiId\":\"123\",\"apiHash\":\"abc\",\"phone\":\"+79001234567\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: UserbotSendCodeRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Результат send_code",
        content: {
          "application/json": {
            schema: UserbotAuthResultSchema,
            example: { ok: true },
          },
        },
      },
      ...AUTH_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/tokens/{tokenId}/userbot/sign-in",
    tags: ["project-tokens"],
    summary: "Userbot auth: код из SMS/Telegram",
    description:
      "Шаг 2: `{ phone, code }`. При `session_string` — сохраняет в БД + userbotEnabled=1.\n\n" +
      auth +
      "```bash\ncurl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/sign-in \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"phone\":\"+79001234567\",\"code\":\"12345\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: UserbotSignInRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Результат / needs_2fa / session",
        content: { "application/json": { schema: UserbotAuthResultSchema } },
      },
      ...AUTH_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/tokens/{tokenId}/userbot/sign-in-2fa",
    tags: ["project-tokens"],
    summary: "Userbot auth: пароль 2FA",
    description:
      "Шаг 3: `{ password }`. При успехе сохраняет session + userbotEnabled=1.\n\n" +
      auth +
      "```bash\ncurl -s -X POST http://localhost:5000/api/projects/42/tokens/7/userbot/sign-in-2fa \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"password\":\"…\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: UserbotSignIn2faRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Результат 2FA",
        content: { "application/json": { schema: UserbotAuthResultSchema } },
      },
      ...AUTH_ERRORS,
    },
  });
}
