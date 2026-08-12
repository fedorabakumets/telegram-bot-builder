/**
 * @fileoverview Zod-схемы тел запросов рассылок (лимиты Telegram + ACL входных данных)
 * @module botIntegration/handlers/broadcasts/broadcast-body-schemas
 */

import { z } from "zod";
import { broadcastFiltersSchema, buttonSchema } from "@shared/schema";

/** Лимит текста сообщения Telegram (без медиа) */
export const BROADCAST_MAX_TEXT_LENGTH = 4096;

/** Максимум медиафайлов в одной рассылке (лимит media group) */
const MAX_MEDIA_URLS = 10;

/** Максимум инлайн-кнопок на сообщение */
const MAX_INLINE_BUTTONS = 100;

/** Максимум кнопок в одном ряду */
const MAX_BUTTONS_PER_ROW = 8;

/** Максимум ботов в одной «большой рассылке» */
const MAX_CAMPAIGN_TOKENS = 100;

/** Список выбранных ботов для «большой рассылки» */
const tokenIdsSchema = z
  .array(z.number().int().positive())
  .min(1, "Выберите хотя бы одного бота")
  .max(MAX_CAMPAIGN_TOKENS, `Не более ${MAX_CAMPAIGN_TOKENS} ботов в одной рассылке`);

/**
 * URL медиа: http(s), относительный путь Studio или JSON file_id.
 * Отсекает javascript:/data:/file: и прочие опасные схемы.
 */
const mediaUrlSchema = z
  .string()
  .min(1)
  .max(16_384)
  .refine(
    (value) =>
      value.startsWith('{"__type":"file_id"') ||
      /^https?:\/\//i.test(value) ||
      value.startsWith("/"),
    { message: "mediaUrls: только http(s), путь /… или file_id JSON" },
  );

/** Фильтры аудитории с лимитами размера массивов (DoS) */
const broadcastFiltersSafeSchema = broadcastFiltersSchema.extend({
  /** Теги */
  tags: z.array(z.string().max(128)).max(50).optional(),
  /** Ручной список userId */
  userIds: z.array(z.string().max(64)).max(10_000).optional(),
  /** Группы */
  groupIds: z.array(z.string().max(64)).max(200).optional(),
});

/** Тело POST …/broadcasts */
export const createBroadcastBodySchema = z.object({
  /** Название рассылки (пустое — сервер соберёт из даты и текста) */
  name: z.string().trim().max(200).optional().default(""),
  /** HTML-текст сообщения */
  messageText: z
    .string()
    .trim()
    .min(1, "Текст сообщения обязателен")
    .max(BROADCAST_MAX_TEXT_LENGTH, `Текст не длиннее ${BROADCAST_MAX_TEXT_LENGTH} символов`),
  /** URL / file_id медиа */
  mediaUrls: z.array(mediaUrlSchema).max(MAX_MEDIA_URLS).default([]),
  /** Инлайн-кнопки */
  buttons: z.array(buttonSchema).max(MAX_INLINE_BUTTONS).default([]),
  /** Кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: z.number().int().min(0).max(MAX_BUTTONS_PER_ROW).default(0),
  /** Фильтры аудитории */
  filters: broadcastFiltersSafeSchema.default({}),
  /** ID токена бота (дублирует query, оставлен для обратной совместимости) */
  tokenId: z.number().int().positive().optional(),
  /** ID выбранных ботов «большой рассылки» (приоритетнее tokenId) */
  tokenIds: tokenIdsSchema.optional(),
});

/** Тело POST …/preview-audience */
export const previewAudienceBodySchema = z.object({
  /** Фильтры аудитории */
  filters: broadcastFiltersSafeSchema.default({}),
  /** ID токена бота (обратная совместимость) */
  tokenId: z.number().int().positive().optional(),
  /** ID выбранных ботов для оценки суммарной аудитории */
  tokenIds: tokenIdsSchema.optional(),
});

/** Тело PUT …/broadcast-campaigns/:campaignId */
export const editBroadcastCampaignBodySchema = z.object({
  /** Новый HTML-текст (лимит Telegram) */
  messageText: z
    .string()
    .trim()
    .min(1, "Текст сообщения обязателен")
    .max(BROADCAST_MAX_TEXT_LENGTH, `Текст не длиннее ${BROADCAST_MAX_TEXT_LENGTH} символов`),
});

/** Тело PUT …/broadcasts/:broadcastId */
export const editBroadcastBodySchema = z.object({
  /** Новый HTML-текст (лимит Telegram) */
  messageText: z
    .string()
    .trim()
    .min(1, "Текст сообщения обязателен")
    .max(BROADCAST_MAX_TEXT_LENGTH, `Текст не длиннее ${BROADCAST_MAX_TEXT_LENGTH} символов`),
});
