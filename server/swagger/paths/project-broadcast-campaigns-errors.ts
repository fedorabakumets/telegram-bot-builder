/**
 * @fileoverview Общие ответы-ошибки и блок безопасности для кампаний рассылок
 * @module server/swagger/paths/project-broadcast-campaigns-errors
 */

import { MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import {
  CAMPAIGN_FORBIDDEN_EXAMPLE,
  CAMPAIGN_NOT_FOUND_EXAMPLE,
} from "./project-broadcast-campaigns-examples";

/**
 * Общий текст про доступ — одинаковая планка со всеми `/api/projects/*`.
 * Вставляется в description каждого эндпоинта кампаний.
 */
export const CAMPAIGN_SECURITY_NOTE =
  "**Доступ:** `requireProjectAccess` — сессионная cookie или Bearer PAT " +
  "плюс права на проект (владелец или коллаборатор). " +
  "Кампания ищется по `campaignId`, но отдаётся только если `campaign.projectId` " +
  "совпадает с `projectId` из пути — иначе 403, поэтому перебор чужих ID ничего не раскрывает.";

/** Вариант ответа 400 для эндпоинта кампаний */
export type CampaignBadRequestKind = "ids" | "body" | "projectId";

/** Настройки набора ответов-ошибок */
export interface CampaignErrorOptions {
  /** Какой текст показать в 400 (по умолчанию — неверные ID) */
  badRequest?: CampaignBadRequestKind;
  /** Добавлять ли 404 (нет для списка кампаний) */
  notFound?: boolean;
}

/** Описание и пример ответа 400 по типу ошибки */
const BAD_REQUEST_VARIANTS: Record<CampaignBadRequestKind, { description: string; message: string }> = {
  ids: { description: "Неверные ID", message: "Неверный ID проекта или кампании" },
  body: { description: "Валидация тела запроса", message: "Неверное тело запроса" },
  projectId: { description: "Неверный ID проекта", message: "Неверный ID проекта" },
};

/**
 * Собирает ответы 400/401/403/404/500 для эндпоинтов кампаний рассылок.
 * @param options - Вариант 400 и наличие 404
 * @returns Карта ответов OpenAPI
 */
export function campaignErrorResponses(options: CampaignErrorOptions = {}): Record<string, unknown> {
  const { badRequest = "ids", notFound = true } = options;
  const variant = BAD_REQUEST_VARIANTS[badRequest];
  const isBody = badRequest === "body";

  const responses: Record<string, unknown> = {
    400: {
      description: variant.description,
      content: {
        "application/json": {
          schema: isBody ? ValidationErrorSchema : MessageErrorSchema,
          example: isBody ? { message: variant.message, errors: [] } : { message: variant.message },
        },
      },
    },
    401: {
      description: "Нет session / PAT",
      content: {
        "application/json": { schema: UnauthorizedSchema, example: { error: "UNAUTHORIZED" } },
      },
    },
    403: {
      description: "Нет доступа к проекту или кампания другого проекта",
      content: {
        "application/json": { schema: MessageErrorSchema, example: CAMPAIGN_FORBIDDEN_EXAMPLE },
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
  };

  if (notFound) {
    responses[404] = {
      description: "Кампания не найдена",
      content: {
        "application/json": { schema: MessageErrorSchema, example: CAMPAIGN_NOT_FOUND_EXAMPLE },
      },
    };
  }

  return responses;
}
