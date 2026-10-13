/**
 * @fileoverview Проверки границ стандартных и произвольных периодов терминала.
 */
import { describe, expect, it } from 'vitest';
import { parseCustomLogRange, resolveLogPeriodRange } from './terminal-log-period';

describe('периоды логов', () => {
  it('оставляет текущий запуск живым', () => {
    expect(resolveLogPeriodRange('live')).toBeNull();
  });
  it.each([['15m', 15], ['1h', 60], ['24h', 1440]] as const)('ограничивает %s точным интервалом', (period, minutes) => {
    const now = new Date('2026-10-11T12:00:00Z');
    const range = resolveLogPeriodRange(period, now)!;
    expect(new Date(range.to).getTime() - new Date(range.from).getTime()).toBe(minutes * 60000);
    expect(range.to).toBe(now.toISOString());
  });
  it('начинает сегодня в локальную полночь', () => {
    const now = new Date(2026, 9, 11, 14, 30);
    const range = resolveLogPeriodRange('today', now)!;
    expect(new Date(range.from)).toEqual(new Date(2026, 9, 11));
    expect(new Date(range.to)).toEqual(now);
  });
  it('выбирает вчера между соседними локальными полуночами', () => {
    const range = resolveLogPeriodRange('yesterday', new Date(2026, 9, 11, 2))!;
    expect(new Date(range.from)).toEqual(new Date(2026, 9, 10));
    expect(new Date(range.to)).toEqual(new Date(2026, 9, 11));
  });
  it.each([['', ''], ['bad', '2026-10-11T10:00'], ['2026-10-11T11:00', '2026-10-11T10:00'],
    ['2026-10-11T10:00', '2026-10-11T10:00']])('отклоняет неверные границы %s — %s', (from, to) => {
    expect(parseCustomLogRange(from, to)).toBeNull();
  });
  it('преобразует локальные поля в абсолютные даты', () => {
    expect(parseCustomLogRange('2026-10-11T09:00', '2026-10-11T10:00')).toEqual({
      from: new Date(2026, 9, 11, 9).toISOString(), to: new Date(2026, 9, 11, 10).toISOString(),
    });
  });
});
