/** @fileoverview Проверки точных расходов, календарных полей и конфликтов зарегистрированных ссылок. */
import { describe, expect, it } from 'vitest';
import { allocateExpense, fromMinorUnits, toMinorUnits } from './money';
import { day, money, rate } from './validation';
import { findStartConflict } from './link-routing';
import { acquisitionDto } from './storage';
describe('Расходы без потери копеек', () => {
  it('сохраняет большую decimal-сумму и распределяет остаток явно', () => {
    expect(fromMinorUnits(toMinorUnits('999999999999999999.99'))).toBe('999999999999999999.99');
    const parts = allocateExpense('100.00', '2026-11-01', '2026-11-03');
    expect(parts.map(part => part.amount)).toEqual(['33.33','33.33','33.34']);
    expect(parts.reduce((sum, part) => sum + toMinorUnits(part.amount), 0n)).toBe(10000n);
  });
  it('не округляет молча неправильную сумму, курс или невозможную дату', () => {
    for (const value of ['-1','1.001','1e3','NaN']) expect(money.safeParse(value).success).toBe(false);
    expect(rate.safeParse('0.00000000').success).toBe(false);
    expect(rate.safeParse('0.00000001').success).toBe(true);
    expect(day.safeParse('2026-02-30').success).toBe(false);
    expect(() => allocateExpense('1','2026-11-03','2026-11-01')).toThrow();
  });
  it('передаёт календарные дни без смещения часового пояса', () => {
    expect(acquisitionDto({ day: new Date(2026, 10, 2), created_at: new Date('2026-11-02T00:00:00Z') }))
      .toEqual({ day: '2026-11-02', createdAt: '2026-11-02T00:00:00.000Z' });
  });
});
describe('Порядок маршрутов start', () => {
  it('блокирует публичную метку, перехваченную существующим маршрутом', () => {
    const data = { sheets: [{ nodes: [{ id: 'custom', type: 'command_trigger', data: { command: '/start', deepLinkParam: 'bc_', deepLinkMatchMode: 'startsWith', autoTransitionTo: 'target' } }] }] };
    expect(findStartConflict(data, 'bc_example')).toBe('custom');
    expect(findStartConflict(data, 'different')).toBeNull();
  });
});
