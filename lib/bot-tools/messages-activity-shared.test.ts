/** @fileoverview Проверки общих для UI и MCP расчётов сообщений без потери дробного среднего. */
import { describe, expect, it } from 'vitest';
import { calculateCumulativeMessages, getMessagesActivitySeries, getMessagesActivitySummary } from '../../shared/analytics/messages-activity';

describe('общие расчёты активности сообщений', () => {
  /** Проверяет разные источники общего счётчика и периода и точность среднего. */
  it('считает направления периода независимо от сохранённого общего числа', () => {
    const points = [{ date: '2026-10-12', incoming: 15, outgoing: 78 }];
    expect(getMessagesActivitySummary(points, 701, 7)).toEqual({
      totalMessages: 701, periodMessages: 93, incomingMessages: 15, outgoingMessages: 78,
      averagePerUser: 701 / 7,
    });
  });
  /** Проверяет отсутствие деления на ноль при пустой аудитории и периоде. */
  it('для пустого периода и отсутствия пользователей возвращает нулевые значения', () => {
    expect(getMessagesActivitySummary([], 0, 0)).toEqual({
      totalMessages: 0, periodMessages: 0, incomingMessages: 0, outgoingMessages: 0, averagePerUser: 0,
    });
    expect(calculateCumulativeMessages([])).toEqual([]);
  });
  /** Проверяет сортировку, перенос итогов через нулевые интервалы и неизменность входа. */
  it('накапливает от нуля и сохраняет направления на пропусках', () => {
    const points = [
      { date: '2026-10-12', incoming: 0, outgoing: 3 },
      { date: '2026-10-10', incoming: 2, outgoing: 0 },
      { date: '2026-10-11', incoming: 0, outgoing: 0 },
    ];
    const before = structuredClone(points);
    expect(calculateCumulativeMessages(points)).toEqual([
      { date: '2026-10-10', incoming: 2, outgoing: 0 },
      { date: '2026-10-11', incoming: 2, outgoing: 0 },
      { date: '2026-10-12', incoming: 2, outgoing: 3 },
    ]);
    expect(points).toEqual(before);
  });
  /** Проверяет согласованность суммарной серии с отдельными направлениями. */
  it('строит общую серию как сумму направлений', () => {
    expect(getMessagesActivitySeries([{ date: '2026-10-12', incoming: 2, outgoing: 3 }])).toEqual({
      incomingPoints: [{ date: '2026-10-12', count: 2 }],
      outgoingPoints: [{ date: '2026-10-12', count: 3 }],
      totalPoints: [{ date: '2026-10-12', count: 5 }],
    });
  });
});
