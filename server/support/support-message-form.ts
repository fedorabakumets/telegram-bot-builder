/**
 * @fileoverview Чтение полей multipart сообщения поддержки
 * @module server/support/support-message-form
 */

import type { Request } from "express";
import type { SupportMessageContext } from "@shared/support/support.types";
import { userSupportMessageSchema } from "./support-validation";

/** Разобранная форма сообщения */
export interface SupportMessageForm {
  /** Текст, уже без пробелов по краям. Может быть пустым */
  text: string;
  /** Контекст отправки, только у пользователя */
  context?: SupportMessageContext;
  /** Файлы из поля files */
  files: Express.Multer.File[];
}

/**
 * Читает text, context и files из multipart-запроса
 * @param req - Запрос после multer
 * @param withContext - Разбирать ли поле context (сообщение пользователя)
 * @returns Форма или текст ошибки 400
 */
export function readSupportMessageForm(
  req: Request,
  withContext: boolean,
): SupportMessageForm | { error: string } {
  const raw = (req.body ?? {}) as { text?: unknown; context?: unknown };
  let context: unknown = raw.context;
  if (withContext && typeof context === "string" && context.trim()) {
    try {
      context = JSON.parse(context) as unknown;
    } catch {
      return { error: "Неверный контекст" };
    }
  }

  const parsed = userSupportMessageSchema.safeParse({
    text: typeof raw.text === "string" ? raw.text : "",
    ...(withContext && context != null && context !== "" ? { context } : {}),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const files = Array.isArray(req.files) ? req.files : [];
  if (!parsed.data.text && files.length === 0) {
    return { error: "Сообщение не может быть пустым" };
  }

  return { text: parsed.data.text, context: parsed.data.context, files };
}
