/**
 * @fileoverview OpenAPI: GET/POST /broadcasts.
 * @module server/swagger/paths/project-broadcasts-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BroadcastsListResponseSchema,
  CreateBroadcastRequestSchema,
  CreateBroadcastResultSchema,
  ProjectBroadcastsListQuerySchema,
  ProjectBroadcastsProjectIdParamsSchema,
} from "../schemas/project-broadcasts";
import {
  CREATE_BROADCAST_BODY_EXAMPLE,
  CREATE_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
  CREATE_BROADCAST_MULTI_BODY_EXAMPLE,
  CREATE_BROADCAST_RESPONSE_EXAMPLE,
  PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
  PROJECT_BROADCASTS_LIST_EXAMPLE,
} from "./project-broadcasts-examples";

/**
 * Регистрирует список и создание рассылок.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/broadcasts",
    tags: ["project-broadcasts"],
    summary: "Список рассылок проекта",
    description:
      "История рассылок (Broadcast panel) с пагинацией. `tokenId` фильтрует по боту.\n\n" +
      "**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `use-broadcasts`.\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts?page=1&tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
      query: ProjectBroadcastsListQuerySchema,
    },
    responses: {
      200: {
        description: "Страница рассылок",
        content: {
          "application/json": {
            schema: BroadcastsListResponseSchema,
            example: PROJECT_BROADCASTS_LIST_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверный projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/broadcasts",
    tags: ["project-broadcasts"],
    summary: "Создать и запустить рассылку (один бот или несколько)",
    description:
      "Создаёт рассылку со статусом `running` и запускает очередь отправки. " +
      "Текст ≤4096, media ≤10, buttons ≤100. `name` необязательно " +
      "(пустое → дата + начало текста сообщения).\n\n" +
      "**Выбор ботов.** `tokenIds` (1…100 ID токенов проекта) задаёт «большую рассылку " +
      "по нескольким ботам»: создаётся кампания, на каждого бота — своя дочерняя рассылка, " +
      "очереди стартуют параллельно, ответ `{ campaignId, broadcastIds }`. " +
      "Один элемент в `tokenIds` или обычный `tokenId` (query/body) — рассылка от одного бота, " +
      "ответ `{ broadcastId }`. Без обоих полей берётся default-токен проекта.\n\n" +
      "**Безопасность:** каждый ID из `tokenIds` проверяется на принадлежность проекту; " +
      "чужой или несуществующий токен → 400 «Токены не принадлежат этому проекту: …». " +
      "Группы: `groupsByTokenId` (tokenId → chat_id[]) — у каждого бота свои чаты; " +
      "`filters.groupIds` — для одного бота / дочерней рассылки. " +
      "Сервер проверяет, что чат виден этому токену (`bot_groups` / `bot_messages`).\n\n" +
      "**Клиенты Studio:** мастер «Новая рассылка» (`use-create-broadcast`).\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"messageText\":\"Привет!\",\"tokenIds\":[7,8],\"groupsByTokenId\":{\"7\":[\"-1001\"],\"8\":[\"-1002\"]},\"filters\":{}}' \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
      query: ProjectBroadcastsListQuerySchema.pick({ tokenId: true }),
      body: {
        content: {
          "application/json": {
            schema: CreateBroadcastRequestSchema,
            examples: {
              multiBot: {
                summary: "Большая рассылка по нескольким ботам",
                value: CREATE_BROADCAST_MULTI_BODY_EXAMPLE,
              },
              singleBot: {
                summary: "Один бот (default-токен проекта)",
                value: CREATE_BROADCAST_BODY_EXAMPLE,
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Рассылка создана и запущена",
        content: {
          "application/json": {
            schema: CreateBroadcastResultSchema,
            examples: {
              multiBot: {
                summary: "Большая рассылка: кампания и дочерние рассылки",
                value: CREATE_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
              },
              singleBot: {
                summary: "Один бот",
                value: CREATE_BROADCAST_RESPONSE_EXAMPLE,
              },
            },
          },
        },
      },
      400: {
        description: "Валидация, нет токена или чужой tokenId",
        content: {
          "application/json": {
            schema: ValidationErrorSchema,
            examples: {
              validation: {
                summary: "Тело не прошло валидацию",
                value: { message: "Неверное тело запроса", errors: [] },
              },
              foreignToken: {
                summary: "tokenIds содержит токен другого проекта",
                value: { message: "Токены не принадлежат этому проекту: 91" },
              },
            },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });
}
