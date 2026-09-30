/**
 * @fileoverview Отправка сообщения поддержки как multipart: текст и картинки
 * @module components/support/post-support-message
 */

import type { SupportMessageContext, SupportMessageDto } from "@shared/support/support.types";

/** То, что уходит из поля ввода */
export interface SupportComposerPayload {
  /** Текст. Может быть пустым, если есть картинки */
  text: string;
  /** Выбранные картинки */
  files: File[];
}

/**
 * Отправляет сообщение поддержки. Content-Type не задаётся: границу multipart ставит браузер
 * @param url - Путь POST
 * @param payload - Текст и файлы
 * @param context - Контекст страницы, только у пользователя
 * @returns Сохранённое сообщение
 */
export async function postSupportMessage(
  url: string,
  payload: SupportComposerPayload,
  context?: SupportMessageContext,
): Promise<SupportMessageDto> {
  const body = new FormData();
  body.append("text", payload.text);
  if (context) body.append("context", JSON.stringify(context));
  for (const file of payload.files) body.append("files", file, file.name);

  const res = await fetch(url, { method: "POST", body, credentials: "include" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new Error(data?.error || data?.message || "Не удалось отправить сообщение");
  }
  return res.json() as Promise<SupportMessageDto>;
}
