/** @fileoverview Разделение счётчиков сообщений по достоверному типу чата. */
import { v2Count } from './query-scope';
import type { AnalyticsV2MessageScope } from '../../../../shared/analytics/v2';

/** Создаёт SQL-агрегаты известных личных и групповых событий. @returns Список агрегатов для выборки событий. */
export function messageScopeSql(): string {
  return [['private', "chat_type='private'"], ['group', "chat_type IN ('group','supergroup')"]].flatMap(([prefix, filter]) => [
    ...[['incoming', 'message_in'], ['outgoing', 'message_out'], ['callbacks', 'callback']].map(([name, kind]) =>
      `COUNT(*) FILTER(WHERE kind='${kind}' AND ${filter}) ${prefix}_${name}`),
    `COUNT(*) FILTER(WHERE kind='message_in' AND ${filter}${prefix === 'group' ? ' AND confirmed_directed' : ''}) ${prefix}_incoming_to_bot`,
  ]).join(',');
}

/** Создаёт агрегаты старых подтверждённых записей по типу чата. @returns Список агрегатов свидетельств. */
export function historicalScopeSql(): string {
  return `COUNT(*) FILTER(WHERE chat_type='private') private_historical_callbacks,
    COUNT(*) FILTER(WHERE chat_type IN ('group','supergroup')) group_historical_callbacks`;
}

/** Создаёт список полей для объединения событий и старой истории. @returns Поля выборки. */
export function scopeColumnsSql(): string {
  return ['private', 'group'].flatMap(prefix => [
    ...['incoming', 'incoming_to_bot', 'outgoing', 'callbacks'].map(name => `c.${prefix}_${name}`), `h.${prefix}_historical_callbacks`,
  ]).join(',');
}

/** Преобразует агрегаты и старые свидетельства в типизированные значения. @param row - Строка SQL. @param prefix - Тип чата. @returns Счётчики чата. */
export function messageScope(row: Record<string, unknown>, prefix: 'private' | 'group'): AnalyticsV2MessageScope {
  return { incoming: v2Count(row[`${prefix}_incoming`]), incoming_to_bot: v2Count(row[`${prefix}_incoming_to_bot`]), outgoing: v2Count(row[`${prefix}_outgoing`]),
    callbacks: v2Count(row[`${prefix}_callbacks`]), historical_callbacks: v2Count(row[`${prefix}_historical_callbacks`]) };
}
