/** @fileoverview OpenAPI общего снимка v2, качества истории и общих фильтров. */
import './common';
import { z } from 'zod';
import { AnalyticsV2LeaderSchema, AnalyticsV2PointSchema, AnalyticsV2SourceSchema, AnalyticsV2SummarySchema } from './analytics-v2-metrics';
/** Общие фильтры; готовый период исключает явные from/to. */
export const AnalyticsV2QuerySchema = z.object({
  /** Один бот либо весь проект. */ tokenId: z.coerce.number().int().positive().optional(),
  /** Окно; по умолчанию последние 30 дней. */ period: z.enum(['1h','3h','24h','7d','30d','12w','12m','all']).optional(),
  /** Включённая ISO-граница с поясом. */ from: z.string().datetime({ offset: true }).optional(),
  /** Исключённая ISO-граница с поясом. */ to: z.string().datetime({ offset: true }).optional(),
  /** Независимый шаг, до 500 точек. */ step: z.enum(['1m','5m','1h','1d','7d','30d']).optional(),
  /** Пояс календарных интервалов и отображения. */ timezone: z.string().optional().openapi({ example: 'Europe/Moscow' }),
  /** Сравнение равных окон; недоступно для all. */ comparison: z.literal('previous').optional(),
});
/** Полный согласованный ответ: неизвестное покрытие не является нулевой историей. */
export const AnalyticsV2SnapshotSchema = z.object({
  /** Методика. */ schema_version: z.literal(2),
  /** Подтверждённая аудитория каждого бота проекта за всё время. */
  token_audiences: z.array(z.object({
    /** ID бота проекта. */ token_id: z.number().int(),
    /** Подтверждённые люди. */ total_users: z.number().int().nonnegative(),
  })).optional(),
  /** Проект. */ project_id: z.number().int(),
  /** Бот или проект. */ token_id: z.number().int().nullable(),
  /** Момент снимка. */ as_of: z.string().datetime(),
  /** Версия без потери bigint. */ revision: z.string(),
  /** Единый диапазон. */ range: z.object({
    /** Включённая граница UTC. */ from: z.string().datetime(),
    /** Исключённая граница UTC. */ to: z.string().datetime(),
    /** IANA-пояс. */ timezone: z.string(),
    /** Номинальный шаг; календарные сутки при смене летнего времени могут длиться 23/25 часов. */ step_ms: z.number(),
    /** Готовое окно. */ period: z.string().nullable(),
  }),
  /** Полнота истории. */ coverage: z.object({
    /** Оценка полноты. */ status: z.enum(['complete','partial','unavailable']),
    /** Начало покрытия. */ from: z.string().nullable(),
    /** Ранее существовавшие профили. */ legacy_unknown_users: z.number(),
    /** Покрытие по ботам. */ bots: z.array(z.object({
      /** Бот. */ token_id: z.number(),
      /** Начало покрытия. */ from: z.string().nullable(),
      /** Методика сборки. */ version: z.number(),
    })),
    /** Пояснение. */ description: z.string(),
  }),
  /** Текущее окно. */ current: AnalyticsV2SummarySchema,
  /** Предыдущее равное окно. */ previous: AnalyticsV2SummarySchema.nullable(),
  /** Общий ряд. */ points: z.array(AnalyticsV2PointSchema).max(500),
  /** Топы по направленным действиям и наблюдаемой переписке. */ leaders: z.object({
    /** Люди. */ users: z.array(AnalyticsV2LeaderSchema),
    /** Взаимодействия групп. */ groups: z.array(AnalyticsV2LeaderSchema),
    /** Наблюдаемые сообщения групп. */ groups_observed: z.array(AnalyticsV2LeaderSchema),
    /** Независимый рейтинг групп по сообщениям. */ groups_messages: z.array(AnalyticsV2LeaderSchema).optional(),
  }),
  /** Источники. */ sources: z.array(AnalyticsV2SourceSchema),
  /** Источники предыдущего окна при включённом сравнении. */ previous_sources: z.array(AnalyticsV2SourceSchema).nullable(),
  /** Приход по источникам. */ source_points: z.array(z.object({
    /** Слот. */ date: z.string(), /** Источник. */ id: z.string(),
    /** Исключённый конец календарного слота UTC. */ end_date: z.string().datetime().optional(),
    /** Название. */ label: z.string(), /** Новые. */ new_users: z.number(),
    /** Первые сохранённые контакты с неизвестной фактической первой датой. */ restored_users: z.number().int().nonnegative().optional(),
  })),
  /** Популярные нажатия. */ buttons: z.array(z.object({ /** Подпись. */ label: z.string(), /** Число. */ count: z.number(), /** Старые проверенные нажатия без Telegram ID. */ historical_count: z.number().int().nonnegative().optional(), /** Уникальные люди с учётом проверенной истории. */ people: z.number().int().nonnegative().optional() })),
  /** Доступность сейчас. */ availability: z.object({
    /** Доступны. */ available: z.number(), /** Блокировали. */ blocked: z.number(),
    /** Удалены. */ deleted: z.number(), /** Проверено. */ checked_at: z.string().nullable(),
  }),
  /** Свойства профиля сейчас. */ composition: z.object({
    /** Premium. */ premium: z.number(), /** Обычные. */ regular: z.number(), /** Неизвестно. */ unknown: z.number(),
    /** Языки. */ languages: z.array(z.object({ /** Код. */ code: z.string(), /** Люди. */ count: z.number() })),
  }),
  /** Следующая граница скользящего окна. */ next_recompute_at: z.string().nullable(),
}).openapi('AnalyticsV2Snapshot');
