/**
 * @fileoverview Схемы проверки входящих данных чата поддержки
 * @module server/support/support-validation
 */

import { z } from "zod";
import { SUPPORT_MESSAGE_MAX_LENGTH } from "@shared/support/support.types";

/**
 * Текст сообщения: пробелы по краям обрезаются, длина ограничена.
 * Пустая строка допустима, если к сообщению приложены картинки — это проверяет хендлер.
 */
const messageTextSchema = z
  .string()
  .trim()
  .max(SUPPORT_MESSAGE_MAX_LENGTH, `Сообщение длиннее ${SUPPORT_MESSAGE_MAX_LENGTH} символов`);

/** Контекст отправки: всё необязательно, строки обрезаются */
const contextSchema = z
  .object({
    /** Идентификатор открытого проекта */
    projectId: z.number().int().positive().nullable().optional(),
    /** Путь страницы */
    path: z.string().max(500).optional(),
    /** Строка браузера */
    userAgent: z.string().max(500).optional(),
  })
  .strict();

/** Тело POST /api/support/messages */
export const userSupportMessageSchema = z.object({
  /** Текст сообщения */
  text: messageTextSchema,
  /** Контекст отправки */
  context: contextSchema.optional(),
});

/** Тело POST /admin/api/support/threads/:id/messages */
export const adminSupportMessageSchema = z.object({
  /** Текст ответа */
  text: messageTextSchema,
});

/** Тело PATCH /admin/api/support/threads/:id */
export const adminSupportStatusSchema = z.object({
  /** Новый статус диалога */
  status: z.enum(["open", "closed"]),
});

/** Фильтр списка диалогов в админке */
export const adminSupportListFilterSchema = z.enum(["open", "closed", "all"]).catch("open");

/**
 * Разбирает положительный целочисленный идентификатор из строки
 * @param raw - Значение параметра маршрута
 * @returns Число или null при неверном значении
 */
export function parseSupportId(raw: unknown): number | null {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
