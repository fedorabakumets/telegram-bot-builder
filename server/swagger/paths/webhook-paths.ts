/**
 * @fileoverview OpenAPI paths для входящего Telegram webhook
 * @module server/swagger/paths/webhook-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SetupRequiredSchema } from "../schemas/common";
import { TelegramWebhookUpdateSchema, WebhookBadParamsSchema, WebhookEmptyBodySchema } from "../schemas/webhook";

/**
 * Регистрирует детальный OpenAPI path приёма webhook от Telegram.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security (публичный эндпоинт)
 * @returns void
 */
export function registerWebhookPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "post",
    path: "/api/webhook/{projectId}/{tokenId}",
    tags: ["webhook"],
    summary: "Приём апдейта Telegram (webhook режим)",
    description:
      "**Публичный** эндпоинт — Telegram Server API шлёт сюда POST без cookie и без PAT. " +
      "Путь в allowlist `requireApiAuth` (`/webhook/`).\n\n" +
      "**Когда используется:** только если токен бота в настройках запуска имеет `launchMode: webhook`. " +
      "При старте бот регистрирует в Telegram URL:\n" +
      "`{webhookBaseUrl}/api/webhook/{projectId}/{tokenId}`\n\n" +
      "**Поток:**\n" +
      "1. Telegram → POST этот URL с JSON Update\n" +
      "2. Node.js (`setupWebhookRoutes`) проксирует body на `http://localhost:{9000+tokenId}/webhook`\n" +
      "3. Python aiohttp + aiogram (`SimpleRequestHandler`) обрабатывает сценарий\n\n" +
      "**UI:** превью URL в `BotLaunchSettings` (`buildWebhookPreview`).\n\n" +
      "**Порт Python:** `9000 + tokenId` (константа `BASE_WEBHOOK_PORT` в `setupWebhookRoutes.ts`). " +
      "В Worker Pool каждый бот внутри `worker.py` поднимает свой aiohttp на этом порту.\n\n" +
      "**Ответ:** обычно **пустое body** — статус копируется с Python-сервера или `200` при ошибке прокси " +
      "(чтобы Telegram не ретраил апдейт, если процесс бота недоступен).\n\n" +
      "**Безопасность:** Node **не** проверяет `webhookSecretToken` из настроек токена — " +
      "секрет можно задать только при `set_webhook` на стороне бота (отдельная задача). " +
      "Не публикуйте URL без TLS на production.\n\n" +
      "**Polling vs webhook:** при `launchMode: polling` этот URL не регистрируется в Telegram; " +
      "эндпоинт может оставаться доступным, но апдейты не приходят.",
    security: publicSecurity,
    request: {
      params: z.object({
        /** ID проекта (`bot_projects.id`) */
        projectId: z.string().openapi({
          example: "266",
          description: "ID проекта — часть публичного webhook URL",
        }),
        /** ID токена бота (`bot_tokens.id`) */
        tokenId: z.string().openapi({
          example: "233",
          description: "ID токена — определяет порт Python (9000 + tokenId)",
        }),
      }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: TelegramWebhookUpdateSchema,
            examples: {
              textMessage: {
                summary: "Текстовое сообщение",
                value: {
                  update_id: 10000,
                  message: {
                    message_id: 1365,
                    date: 1441645532,
                    chat: { id: 783828, type: "private", first_name: "User" },
                    text: "Привет",
                  },
                },
              },
              callbackQuery: {
                summary: "Callback от inline-кнопки",
                value: {
                  update_id: 10001,
                  callback_query: {
                    id: "99887766",
                    from: { id: 783828, is_bot: false, first_name: "User" },
                    chat_instance: "123456789",
                    data: "btn_ok",
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "Апдейт принят. Body **пустое** (не JSON). Статус HTTP копируется с aiohttp или принудительно 200 при ошибке прокси.",
        content: {
          "text/plain": {
            schema: WebhookEmptyBodySchema,
            examples: {
              botProcessed: {
                summary: "200 — Python-бот доступен",
                description:
                  "Прокси дошёл до http://localhost:{9000+tokenId}/webhook. " +
                  "Статус совпадает с aiohttp (обычно 200), body пустое.",
                value: "",
              },
              botUnavailable: {
                summary: "200 — Python-бот недоступен (fallback)",
                description:
                  "fetch на localhost упал (бот не запущен, порт закрыт). " +
                  "Node отвечает 200 с пустым body, чтобы Telegram не ретраил апдейт.",
                value: "",
              },
            },
          },
        },
        headers: {
          "Content-Length": {
            description: "Длина body в байтах (обычно 0)",
            schema: { type: "integer", example: 0 },
          },
        },
      },
      400: {
        description: "Некорректные `projectId` или `tokenId` в path (не число)",
        content: {
          "application/json": {
            schema: WebhookBadParamsSchema,
            example: { message: "Некорректные projectId или tokenId" },
          },
        },
      },
      503: {
        description:
          "Глобальный `setupGuard` — приложение ещё не настроено. " +
          "До завершения setup (через /admin) webhook с production не работает.",
        content: {
          "application/json": {
            schema: SetupRequiredSchema,
            example: {
              setupRequired: true,
              message: "Приложение не настроено. Перейдите в /admin для настройки",
            },
          },
        },
      },
    },
  });
}
