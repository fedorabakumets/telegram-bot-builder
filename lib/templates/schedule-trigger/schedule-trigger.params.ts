/**
 * @fileoverview Параметры для шаблона schedule_trigger
 * @module templates/schedule-trigger/schedule-trigger.params
 */

/** Одно правило расписания */
export interface ScheduleRule {
  /** Режим: interval, weekday, monthday, cron */
  mode: 'interval' | 'weekday' | 'monthday' | 'cron';
  /** Интервал в минутах (mode=interval) */
  intervalMinutes?: number;
  /** Дни недели: mon, tue, wed, thu, fri, sat, sun */
  days?: string[];
  /** Час запуска (0-23) */
  hour?: number;
  /** Минута запуска (0-59) */
  minute?: number;
  /** Дни месяца (1-31) */
  monthDays?: number[];
  /** Cron-выражение */
  cronExpression?: string;
}

/** Один узел schedule_trigger */
export interface ScheduleTriggerEntry {
  /** ID узла schedule_trigger */
  nodeId: string;
  /** Безопасное имя для Python-идентификаторов */
  safeName: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Массив правил расписания */
  rules: ScheduleRule[];
  /** Часовой пояс */
  timezone: string;
  /** Запустить при старте бота */
  runOnStart: boolean;
  /** Включён */
  enabled: boolean;
  /** Макс. одновременных запусков */
  maxConcurrent: number;
}

/** Параметры для генерации schedule_trigger */
export interface ScheduleTriggerTemplateParams {
  /** Массив schedule-триггеров */
  entries: ScheduleTriggerEntry[];
}
