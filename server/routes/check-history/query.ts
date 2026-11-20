/** @fileoverview Строгая проверка параметров истории и устойчивого курсора без обращения к Telegram. */
import type { Request } from 'express';
/** Проверенные ограничения списка запусков. */
export interface CheckHistoryQuery {
  /** Вид проверки, при отсутствии — оба вида. */ kind?: 'private-chats' | 'telegram-bots';
  /** Бот, участвующий в запуске; общие итоги группы сохраняют исходную область. */ tokenId?: number;
  /** Размер страницы. */ limit: number;
  /** Время последнего элемента прежней страницы. */ beforeAt?: string;
  /** Уникальный ключ последнего элемента прежней страницы. */ beforeId?: string;
}
/** Проверяет положительный идентификатор PostgreSQL. @param value - Входная строка. @returns Число либо ошибка. */
export function positiveHistoryId(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) throw new Error('Неверный идентификатор');
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > 2147483647) throw new Error('Неверный идентификатор');
  return id;
}
/** Проверяет уникальный ключ запуска. @param value - Параметр пути или курсора. @returns Безопасный ключ. */
export function parseHistoryRunId(value: unknown): string {
  if (typeof value !== 'string' || !/^(chat-job|chat-batch|telegram-bots):[1-9]\d*$/.test(value)) throw new Error('Неверная проверка');
  positiveHistoryId(value.split(':')[1]);
  return value;
}
/** Разбирает фильтры и непрозрачный курсор страницы. @param query - Строка запроса. @returns Проверенные ограничения. */
export function parseHistoryQuery(query: Request['query']): CheckHistoryQuery {
  const result: CheckHistoryQuery = { limit: query.limit === undefined ? 20 : positiveHistoryId(query.limit) };
  if (result.limit > 50) throw new Error('Размер страницы не более 50');
  if (query.kind !== undefined) {
    if (query.kind !== 'private-chats' && query.kind !== 'telegram-bots') throw new Error('Неверный вид проверки');
    result.kind = query.kind;
  }
  if (query.tokenId !== undefined) result.tokenId = positiveHistoryId(query.tokenId);
  if (query.cursor !== undefined) {
    if (typeof query.cursor !== 'string' || query.cursor.length > 512 || !/^[\w-]+$/.test(query.cursor)) throw new Error('Неверный курсор');
    const value = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8'));
    if (!value || typeof value.at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.at) || !Number.isFinite(Date.parse(value.at))) throw new Error('Неверный курсор');
    result.beforeAt = value.at;
    result.beforeId = parseHistoryRunId(value.id);
  }
  return result;
}
