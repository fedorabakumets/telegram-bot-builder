/**
 * @fileoverview Отображаемое имя рассылки с автогенерацией из текста
 * @module client/components/editor/broadcast/utils/resolve-broadcast-display-name
 */

import { buildBroadcastDefaultName } from "./build-broadcast-default-name";

/**
 * Возвращает имя для UI: заданное пользователем или авто из даты/текста.
 * Старые «Без названия» тоже заменяются автоименем.
 * @param name - Сохранённое название
 * @param messageText - HTML-текст сообщения
 * @param date - Дата для метки (createdAt / сейчас)
 * @returns Строка для списка, карточки и подтверждения
 */
export function resolveBroadcastDisplayName(
  name: string | null | undefined,
  messageText: string,
  date?: Date | string | null,
): string {
  const trimmed = (name ?? "").trim();
  if (trimmed && trimmed !== "Без названия") {
    return trimmed;
  }

  const when =
    date instanceof Date
      ? date
      : typeof date === "string" && date
        ? new Date(date)
        : new Date();

  return buildBroadcastDefaultName(messageText, Number.isNaN(when.getTime()) ? new Date() : when);
}
