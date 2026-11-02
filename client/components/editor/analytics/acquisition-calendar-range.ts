/** @fileoverview Календарные границы рекламного отчёта без изменения скользящих периодов остальных графиков. */
import { nextReportDay, reportDay, reportMidnight } from './analytics-report-filter';
/** Минимальные границы снимка для рекламы. */
export interface AcquisitionCalendarRange {
  /** Начало исходного окна. */ from: string;
  /** Конец исходного окна и момент снимка. */ to: string;
  /** Часовой пояс расходов. */ timezone: string;
  /** Выбранный готовый период либо календарные даты. */ period?: string | null;
}
/**
 * Включает выбранное число календарных дней, заканчивая текущий день моментом снимка.
 * @param range - Границы общего отчёта.
 * @returns Границы рекламы; явные календарные даты сохраняются.
 */
export function acquisitionCalendarRange(range: AcquisitionCalendarRange): AcquisitionCalendarRange {
  const days: Record<string, number> = { '1h': 1, '3h': 1, '24h': 1, '7d': 7, '30d': 30, '12w': 84, '12m': 365 };
  const count = range.period ? days[range.period] : undefined;
  if (range.period === 'all') return { ...range, from: reportMidnight(reportDay(new Date(range.from), range.timezone), range.timezone) };
  if (!count) return range;
  const today = reportDay(new Date(range.to), range.timezone);
  return { ...range, from: reportMidnight(nextReportDay(today, 1 - count), range.timezone) };
}
