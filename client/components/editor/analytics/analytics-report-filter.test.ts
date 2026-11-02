/** @fileoverview Проверки календарных границ, переходов часового пояса и точных расходов. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialReportFilter, reportMidnight, reportParams, reportStepAvailable } from './analytics-report-filter';
import { acquisitionMoney, previewExpenseAllocation } from './acquisition-money';
import { analyticsReturnHref } from './analytics-dialog-return';
afterEach(() => { vi.useRealTimers(); sessionStorage.clear(); localStorage.clear(); window.history.replaceState({}, '', '/'); });
describe('календарный период аналитики', () => {
  it('переводит московскую полночь в UTC', () => {
    expect(reportMidnight('2026-11-02', 'Europe/Moscow')).toBe('2026-11-01T21:00:00.000Z');
  });
  it('сохраняет 23 часа календарного дня перехода на летнее время', () => {
    const start = reportMidnight('2026-03-29', 'Europe/Berlin');
    const end = reportMidnight('2026-03-30', 'Europe/Berlin');
    expect(Date.parse(end) - Date.parse(start)).toBe(23 * 3600000);
  });
  it('ограничивает сегодняшний календарный день текущим моментом', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-02T09:30:00Z'));
    const filter = { ...initialReportFilter(12), period: 'custom' as const, from: '2026-11-02', to: '2026-11-02' };
    const params = reportParams(filter, 3);
    expect(params.get('from')).toBe('2026-11-01T21:00:00.000Z');
    expect(params.get('to')).toBe('2026-11-02T09:30:00.000Z');
    expect(params.get('tokenId')).toBe('3');
  });
  it('отключает сравнение для всего времени и отклоняет перевёрнутые даты', () => {
    const filter = initialReportFilter(12);
    expect(reportParams({ ...filter, period: 'all' }).has('comparison')).toBe(false);
    expect(() => reportParams({ ...filter, period: 'custom', from: '2026-11-05', to: '2026-11-01' })).toThrow();
  });
  it('восстанавливает выбранный период при возврате', () => {
    sessionStorage.setItem('analytics:report:12', JSON.stringify({ ...initialReportFilter(12), period: '7d' }));
    expect(initialReportFilter(12).period).toBe('7d');
  });
  it('не предлагает детализацию, превышающую лимит точек', () => {
    const filter = initialReportFilter(12);
    expect(reportStepAvailable(filter, '1m')).toBe(false);
    expect(reportStepAvailable(filter, '1d')).toBe(true);
    expect(reportParams({ ...filter, step: '1d' }).get('step')).toBe('1d');
  });
});
describe('точная денежная арифметика предпросмотра', () => {
  it('распределяет остаток копеек, сохраняя исходную сумму', () => {
    expect(previewExpenseAllocation('100.00', '2026-11-01', '2026-11-03').map(item => item.amount)).toEqual(['33.33', '33.33', '33.34']);
  });
  it('различает ноль, отсутствие и слишком точную сумму', () => {
    expect(acquisitionMoney(null, 'RUB')).toBe('Не указан');
    expect(acquisitionMoney('0.00', 'RUB')).toBe('0,00 ₽');
    expect(previewExpenseAllocation('0.001', '2026-11-01', '2026-11-01')).toEqual([]);
  });
  it('не теряет точность большой decimal-суммы', () => {
    expect(previewExpenseAllocation('9007199254740993.01', '2026-11-01', '2026-11-01')[0].amount).toBe('9007199254740993.01');
  });
});
it('разрешает возврат только к аналитике того же проекта', () => {
  window.history.replaceState({}, '', '/projects/12?analyticsReturn=%2Fprojects%2F12%3Ftab%3Danalytics');
  expect(analyticsReturnHref()).toBe('/projects/12?tab=analytics');
  window.history.replaceState({}, '', '/projects/12?analyticsReturn=%2F%2Fevil.example%2Fprojects%2F12%3Ftab%3Danalytics');
  expect(analyticsReturnHref()).toBeNull();
  window.history.replaceState({}, '', '/projects/12?analyticsReturn=%2Fprojects%2F13%3Ftab%3Danalytics');
  expect(analyticsReturnHref()).toBeNull();
});
