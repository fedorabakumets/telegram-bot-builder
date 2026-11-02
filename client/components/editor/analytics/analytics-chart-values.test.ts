/** @fileoverview Проверки кратких дат с исключённой конечной границей и календарными сутками. */
import { expect, it } from 'vitest';
import { compactChartInterval } from './analytics-chart-values';
it('не включает следующий день в подпись недельного интервала', () => {
  expect(compactChartInterval('2026-11-01T00:00:00Z', '2026-11-08T00:00:00Z', 'UTC', 7 * 86400000)).toBe('1 нояб. — 7 нояб.');
});
it('показывает одни календарные сутки при переходе на зимнее время', () => {
  expect(compactChartInterval('2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z', 'Europe/Berlin', 86400000)).toBe('25 окт.');
});
it('сохраняет время часовых интервалов в выбранном поясе', () => {
  expect(compactChartInterval('2026-11-01T01:00:00Z', '2026-11-01T02:30:00Z', 'Europe/Moscow', 3600000)).toBe('1 нояб., 04:00–05:30');
});
