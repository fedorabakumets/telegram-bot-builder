/** @fileoverview OpenAPI определения подтверждённой аудитории, сообщений и рейтингов. */
import './common';
import { z } from 'zod';
/** Неотрицательный счётчик. */
const count = z.number().int().nonnegative();
/** Итоги окна; только total_users относится ко всему времени. */
export const AnalyticsV2SummarySchema = z.object({
  /** Подтверждённая аудитория. */ audience: z.object({
    /** Новые за период. */ new_users: count,
    /** Первые датированные свидетельства контакта при неизвестном фактическом начале использования. */
    restored_users: count.describe('Уникальные люди с первым сохранённым свидетельством контакта в окне; включает аудированную историю без физического callback ID, не входит в точное привлечение и CPA.'),
    /** Всего за всё время. */ total_users: count,
    /** Уникальные взаимодействовавшие. */ active_users: count.describe('Уникальные люди с событием либо аудированным свидетельством контакта внутри окна.'),
    /** Вернувшиеся. */ returning_users: count.describe('Люди с контактом в окне и первым сохранённым свидетельством раньше окна.'),
    /** Вся аудитория с неизвестной первой датой, независимо от окна. */ unknown_first_users: count,
    /** Полнота истории первых действий в окне; restored_users делает её partial. */ first_history_status: z.enum(['complete','partial','unavailable']),
  }),
  /** Сообщения и отдельные события. */ messages: z.object({
    /** Входящие без callback. */ incoming: count,
    /** Успешные ответы бота. */ outgoing: count,
    /** Реальные нажатия. */ callbacks: count.describe('Физические callback с Telegram ID; старые свидетельства без ID не увеличивают счётчик.'),
    /** События состояния. */ system: count,
    /** Входящие плюс исходящие. */ total: count,
  }),
  /** Групповая активность. */ groups: z.object({
    /** Активные группы. */ active_groups: count,
    /** Наблюдавшиеся авторы. */ participants: count,
    /** Направленные действия. */ directed_actions: count,
  }),
}).openapi('AnalyticsV2Summary');
/** Временная точка; дневные уникальные нельзя складывать в итог периода. */
export const AnalyticsV2PointSchema = z.object({
  /** Начало слота UTC. */ date: z.string().datetime(),
  /** Исключённый конец календарного слота UTC, включая смену летнего времени. */
  end_date: z.string().datetime().optional().describe('Фактический конец интервала, не включённый в него. Для суточного шага это следующая полночь в range.timezone; длительность при смене летнего времени может быть 23 или 25 часов.'),
  /** Новые люди. */ new_users: count,
  /** Первые сохранённые свидетельства контакта людей с неполной ранней историей. */
  restored_users: count.describe('Первое датированное свидетельство контакта попало в слот; фактическое первое использование не установлено.'),
  /** Уникальные активные. */ active_users: count,
  /** Вернувшиеся. */ returning_users: count,
  /** Входящие. */ incoming: count,
  /** Исходящие. */ outgoing: count,
  /** Нажатия. */ callbacks: count,
  /** События состояния. */ system: count,
  /** Группы с событиями внутри слота. */ groups_active: count,
  /** Уникальные авторы наблюдаемых групповых сообщений. */ group_participants: count,
  /** Направленные действия в группах внутри слота. */ group_directed_actions: count,
}).openapi('AnalyticsV2Point');
/** Строка рейтинга без переписки. */
export const AnalyticsV2LeaderSchema = z.object({
  /** Telegram ID строкой. */ id: z.string(),
  /** Отображаемое имя. */ name: z.string(),
  /** Публичный username. */ username: z.string().nullable(),
  /** Уникальные взаимодействовавшие люди в группе, включая аудированную историю. */ people: count.optional(),
  /** Сообщения. */ messages: count,
  /** Нажатия. */ callbacks: count,
  /** Сумма действий. */ total: count,
}).openapi('AnalyticsV2Leader');
/** Подтверждённое происхождение либо честное неизвестное состояние. */
export const AnalyticsV2SourceSchema = z.object({
  /** ID или статус. */ id: z.string(),
  /** Название. */ label: z.string(),
  /** Первое привлечение. */ new_users: count,
  /** Первые сохранённые контакты с неизвестной первой датой. */ restored_users: count.optional(),
  /** Повторно пришедшие люди. */ returning_users: count,
  /** Запуски, не клики. */ starts: count,
}).openapi('AnalyticsV2Source');
