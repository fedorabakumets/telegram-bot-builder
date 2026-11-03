/** @fileoverview Точные структуры старого API диапазонов и рейтингов по JSON обработчиков. */
import './common';
import { z } from 'zod';
/** Счётчики одной точки либо всего окна. */
const counters = z.object({
  /** Всего. */ count: z.number().int().nonnegative(),
  /** Входящие. */ incoming: z.number().int().nonnegative(),
  /** Исходящие. */ outgoing: z.number().int().nonnegative(),
  /** Новые люди. */ newcomers: z.number().int().nonnegative(),
});
/** Результат queryAnalyticsRange. */
const window = z.object({
  /** Включённая граница. */ from: z.string(), /** Исключённая граница. */ to: z.string(),
  /** Шаг. */ step: z.string(), /** Готовый период. */ period: z.string().nullable(),
  /** Длительность. */ duration_ms: z.number(), /** Пояс UTC. */ timezone: z.literal('UTC'),
  /** Правило границ. */ boundary: z.literal('[from,to)'),
  /** Метрика. */ metric: z.enum(['registrations', 'messages', 'active_users']),
  /** Источник данных. */ source: z.string(), /** Ограничения истории. */ retention_description: z.string(),
  /** Итог без суммирования уникальных по дням. */ summary: counters,
  /** Временной ряд. */ points: z.array(counters.extend({ /** Момент точки UTC. */ date: z.string() })),
});
/** Сравнение одной метрики. */
const change = z.object({
  /** Текущее значение. */ current: z.number(), /** Прошлое значение. */ previous: z.number(),
  /** Разница. */ absolute_change: z.number(), /** Процент либо неизвестное при нулевой базе. */ percent_change: z.number().nullable(),
});
/** Полный ответ setupAnalyticsRangeRoutes. */
export const AnalyticsRangeResponseSchema = z.object({
  /** Проект. */ project_id: z.number(), /** Бот или весь проект. */ token_id: z.number().nullable(),
  /** Общий момент снимка. */ as_of: z.string(), /** Текущий период. */ current: window,
  /** Прошлый период. */ previous: window.nullable(), /** Режим сравнения. */ comparison_mode: z.enum(['previous', 'explicit']).nullable(),
  /** Изменения итогов. */ change: z.object({
    /** Всего. */ count: change, /** Входящие. */ incoming: change, /** Исходящие. */ outgoing: change, /** Новички. */ newcomers: change,
  }).nullable(),
});
/** Строка рейтинга queryActivityLeaders. */
const leader = z.object({
  /** Telegram ID. */ id: z.string(), /** События. */ total: z.number(), /** Сообщения. */ messages: z.number(),
  /** Клики. */ clicks: z.number(), /** Последняя активность. */ last_activity: z.string(), /** Отображаемое имя. */ name: z.string(),
});
/** Ответ рейтингов пользователей и групп. */
export const ActivityLeadersResponseSchema = z.object({
  /** Пользователи. */ users: z.array(leader.extend({ /** Username, если известен. */ username: z.string().nullable() })),
  /** Группы. */ groups: z.array(leader), /** Момент снимка. */ as_of: z.string(), /** Выбранный период. */ granularity: z.string(),
});
