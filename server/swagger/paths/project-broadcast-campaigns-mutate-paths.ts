/**
 * @fileoverview OpenAPI: stop / edit / delete кампании («большая рассылка»)
 * @module server/swagger/paths/project-broadcast-campaigns-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectCampaignIdParamsSchema } from "../schemas/project-broadcast-campaigns";
import {
  DeleteBroadcastCampaignResponseSchema,
  EditBroadcastCampaignRequestSchema,
  EditBroadcastCampaignResponseSchema,
  StopBroadcastCampaignResponseSchema,
} from "../schemas/project-broadcast-campaigns-mutate";
import {
  DELETE_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
  EDIT_BROADCAST_CAMPAIGN_BODY_EXAMPLE,
  EDIT_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
  STOP_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
} from "./project-broadcast-campaigns-examples";
import { campaignErrorResponses, CAMPAIGN_SECURITY_NOTE } from "./project-broadcast-campaigns-errors";

/**
 * Регистрирует остановку, редактирование и удаление кампании рассылки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastCampaignsMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/broadcast-campaigns/{campaignId}/stop",
    tags: ["project-broadcasts"],
    summary: "Остановить большую рассылку у всех ботов",
    description:
      "Выставляет флаг остановки всем дочерним рассылкам со статусом `running` " +
      "и пересчитывает агрегаты кампании. Очередь читает флаг между батчами, " +
      "поэтому уже начатый батч может дойти до конца. Уже отправленные сообщения " +
      "остаются у получателей — удалить их можно только через DELETE.\n\n" +
      CAMPAIGN_SECURITY_NOTE +
      "\n\n**Клиенты Studio:** кнопка «⏸ Остановить у всех ботов» в мастере и в пузыре " +
      "рассылки в «Диалогах» (`use-stop-broadcast-campaign`).\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcast-campaigns/3/stop'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectCampaignIdParamsSchema,
    },
    responses: {
      200: {
        description: "Кампания и ID остановленных рассылок",
        content: {
          "application/json": {
            schema: StopBroadcastCampaignResponseSchema,
            example: STOP_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
          },
        },
      },
      ...(campaignErrorResponses() as Record<string, never>),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/broadcast-campaigns/{campaignId}",
    tags: ["project-broadcasts"],
    summary: "Изменить текст большой рассылки у всех ботов",
    description:
      "Обновляет `messageText` кампании и правит уже отправленные сообщения " +
      "через `editMessageText` во всех ботах кампании (throttle ~25/с на бота). " +
      "Текст 1…4096 после trim. В ответе — сводка и разбивка по ботам.\n\n" +
      CAMPAIGN_SECURITY_NOTE +
      "\n\n**Клиенты Studio:** правка текста в пузыре большой рассылки в «Диалогах» " +
      "(`use-edit-broadcast-campaign`).\n\n" +
      "```bash\ncurl -s -X PUT -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"messageText\":\"Обновлённый текст\"}' \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectCampaignIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: EditBroadcastCampaignRequestSchema,
            example: EDIT_BROADCAST_CAMPAIGN_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Сколько сообщений отредактировано по всем ботам",
        content: {
          "application/json": {
            schema: EditBroadcastCampaignResponseSchema,
            example: EDIT_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
          },
        },
      },
      ...(campaignErrorResponses({ badRequest: "body" }) as Record<string, never>),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/broadcast-campaigns/{campaignId}",
    tags: ["project-broadcasts"],
    summary: "Удалить большую рассылку у всех ботов",
    description:
      "Останавливает активные очереди, удаляет отправленные сообщения в Telegram " +
      "по каждому боту и саму кампанию. Дочерние рассылки, их результаты и записи " +
      "`bot_messages` уходят каскадом по `campaign_id`. Токены берутся только " +
      "из этого проекта.\n\n" +
      CAMPAIGN_SECURITY_NOTE +
      "\n\n**Клиенты Studio:** «Удалить у всех ботов» в пузыре рассылки в «Диалогах» " +
      "(`use-delete-broadcast-campaign`).\n\n" +
      "```bash\ncurl -s -X DELETE -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectCampaignIdParamsSchema,
    },
    responses: {
      200: {
        description: "Кампания удалена",
        content: {
          "application/json": {
            schema: DeleteBroadcastCampaignResponseSchema,
            example: DELETE_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE,
          },
        },
      },
      ...(campaignErrorResponses() as Record<string, never>),
    },
  });
}
