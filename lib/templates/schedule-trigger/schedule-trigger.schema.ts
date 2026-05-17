/**
 * @fileoverview Zod схема для валидации параметров schedule_trigger
 * @module templates/schedule-trigger/schedule-trigger.schema
 */

import { z } from 'zod';

/** Схема одного правила расписания */
const scheduleRuleSchema = z.object({
  /** Режим расписания */
  mode: z.enum(['interval', 'weekday', 'monthday', 'cron']),
  /** Интервал в минутах */
  intervalMinutes: z.number().optional(),
  /** Дни недели */
  days: z.array(z.string()).optional(),
  /** Час запуска */
  hour: z.number().optional(),
  /** Минута запуска */
  minute: z.number().optional(),
  /** Дни месяца */
  monthDays: z.array(z.number()).optional(),
  /** Cron-выражение */
  cronExpression: z.string().optional(),
});

/** Схема одного schedule_trigger */
const scheduleTriggerEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя */
  safeName: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Правила расписания */
  rules: z.array(scheduleRuleSchema),
  /** Часовой пояс */
  timezone: z.string(),
  /** Запуск при старте */
  runOnStart: z.boolean(),
  /** Включён */
  enabled: z.boolean(),
  /** Макс. одновременных */
  maxConcurrent: z.number(),
});

/** Схема параметров шаблона schedule_trigger */
export const scheduleTriggerParamsSchema = z.object({
  /** Массив schedule-триггеров */
  entries: z.array(scheduleTriggerEntrySchema),
});

export type ScheduleTriggerParams = z.infer<typeof scheduleTriggerParamsSchema>;
