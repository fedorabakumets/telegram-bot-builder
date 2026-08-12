/**
 * @fileoverview OpenAPI: список кампаний и детали кампании («большая рассылка»)
 * @module server/swagger/paths/project-broadcast-campaigns-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectBroadcastsProjectIdParamsSchema } from "../schemas/project-broadcasts";
import {
  BroadcastCampaignDetailResponseSchema,
  BroadcastCampaignsListResponseSchema,
  ProjectCampaignIdParamsSchema,
} from "../schemas/project-broadcast-campaigns";
import {
  BROADCAST_CAMPAIGNS_LIST_EXAMPLE,
  BROADCAST_CAMPAIGN_DETAIL_EXAMPLE,
} from "./project-broadcast-campaigns-examples";
import { campaignErrorResponses, CAMPAIGN_SECURITY_NOTE } from "./project-broadcast-campaigns-errors";

/**
 * Регистрирует чтение кампаний рассылок проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastCampaignsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/broadcast-campaigns",
    tags: ["project-broadcasts"],
    summary: "Список больших рассылок проекта",
    description:
      "Кампании — «большие рассылки по нескольким ботам» проекта, новые первыми. " +
      "Одна кампания = одно сообщение, ушедшее параллельно от нескольких ботов; " +
      "счётчики в карточке — сумма по всем ботам. Обычные рассылки от одного бота " +
      "сюда не попадают — они в `GET …/broadcasts`.\n\n" +
      CAMPAIGN_SECURITY_NOTE +
      "\n\n**Клиенты Studio:** лента «Диалоги» → строка «Рассылка» (`use-broadcast-campaigns`).\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcast-campaigns'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Кампании проекта",
        content: {
          "application/json": {
            schema: BroadcastCampaignsListResponseSchema,
            example: BROADCAST_CAMPAIGNS_LIST_EXAMPLE,
          },
        },
      },
      ...(campaignErrorResponses({ badRequest: "projectId", notFound: false }) as Record<
        string,
        never
      >),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/broadcast-campaigns/{campaignId}",
    tags: ["project-broadcasts"],
    summary: "Детали большой рассылки",
    description:
      "Карточка кампании и её дочерние рассылки — по одной на каждого бота, " +
      "со своим статусом и счётчиками. Пока кампания идёт, Studio дополняет эти данные " +
      "WS-событиями `broadcast-progress` (у дочерних событий есть `campaignId`).\n\n" +
      CAMPAIGN_SECURITY_NOTE +
      "\n\n**Клиенты Studio:** экран прогресса мастера и пузырь большой рассылки в «Диалогах» " +
      "(`use-broadcast-campaign-detail`).\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcast-campaigns/3'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectCampaignIdParamsSchema,
    },
    responses: {
      200: {
        description: "Кампания и её рассылки по ботам",
        content: {
          "application/json": {
            schema: BroadcastCampaignDetailResponseSchema,
            example: BROADCAST_CAMPAIGN_DETAIL_EXAMPLE,
          },
        },
      },
      ...(campaignErrorResponses() as Record<string, never>),
    },
  });
}
