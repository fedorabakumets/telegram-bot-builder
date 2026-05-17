/**
 * @fileoverview Определение триггера расписания (Schedule Trigger)
 * @module components/editor/sidebar/massive/triggers/schedule-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/**
 * Определение компонента триггера расписания.
 * Запускает цепочку узлов по таймеру без участия пользователя.
 */
export const scheduleTrigger: ComponentDefinition = {
  id: 'schedule-trigger',
  name: 'Расписание',
  description: 'Запуск по таймеру (интервал, день недели, cron)',
  icon: 'fas fa-clock',
  color: 'bg-teal-100 text-teal-600',
  type: 'schedule_trigger' as any,
  defaultData: {
    /** Массив правил расписания */
    rules: [{ mode: 'interval', intervalMinutes: 5 }],
    /** Часовой пояс */
    timezone: 'Europe/Moscow',
    /** ID следующего узла */
    autoTransitionTo: '',
    /** Запустить при старте бота */
    runOnStart: false,
    /** Включён */
    enabled: true,
    /** Макс. одновременных запусков */
    maxConcurrent: 1,
  }
};
