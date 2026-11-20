/** @fileoverview Расписание проверок с интервалом и временем первого запуска. */
import type { CheckHistoryKind } from './check-history';
/** Единицы повторения без неоднозначных cron-выражений. */
export type CheckScheduleUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';
/** Сохраняемые настройки одной области проверок. */
export interface CheckScheduleSettings {
  /** Включён ли автоматический запуск. */ enabled: boolean;
  /** Число единиц между запусками. */ every: number;
  /** Единица интервала. */ unit: CheckScheduleUnit;
  /** Опорное время первого запуска в UTC. */ firstAt: string;
}
/** Публичное расписание без служебных данных исполнителя. */
export interface CheckSchedule extends CheckScheduleSettings {
  /** Вид проверок. */ kind: CheckHistoryKind;
  /** Один бот либо все боты проекта. */ tokenId: number | null;
  /** Следующий запуск в UTC. */ nextRunAt: string;
  /** Время последней попытки запуска. */ lastRunAt: string | null;
  /** Безопасный итог запуска очереди. */ lastOutcome: string | null;
}
/** Вычисляет ближайшее время строго после указанного момента; пропущенные интервалы не копятся. @param firstAt - Опорное время. @param every - Интервал. @param unit - Единица. @param after - Текущее время. @returns Ближайший запуск. */
export function nextCheckRun(firstAt: string, every: number, unit: CheckScheduleUnit, after: Date): Date {
  const first = new Date(firstAt);
  if (!Number.isFinite(first.getTime()) || !Number.isInteger(every) || every < 1) throw new Error('Некорректное расписание');
  if (first > after) return first;
  if (unit !== 'month') {
    const span = every * ({ minute: 60_000, hour: 3_600_000, day: 86_400_000, week: 604_800_000 }[unit]);
    if (!span) throw new Error('Некорректная единица');
    return new Date(first.getTime() + (Math.floor((after.getTime() - first.getTime()) / span) + 1) * span);
  }
  /** Календарные месяцы привязаны к Москве, включая запуски после полуночи по местному времени. */
  const moscow = new Date(first.getTime() + 3 * 3_600_000), localAfter = new Date(after.getTime() + 3 * 3_600_000);
  let step = Math.max(0, Math.floor(((localAfter.getUTCFullYear() - moscow.getUTCFullYear()) * 12 + localAfter.getUTCMonth() - moscow.getUTCMonth()) / every));
  /** Месяцы считаются от исходной даты: после февраля 31-е число возвращается в марте. */
  function monthAt(index: number) {
    const result = new Date(moscow); result.setUTCDate(1); result.setUTCMonth(moscow.getUTCMonth() + index * every);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(moscow.getUTCDate(), lastDay)); return new Date(result.getTime() - 3 * 3_600_000);
  }
  while (monthAt(step) <= after) step++;
  return monthAt(step);
}
