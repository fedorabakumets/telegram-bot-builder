/**
 * @fileoverview Проверки накопления аудитории и пропусков в нескольких сериях
 */

import { describe, expect, it } from 'vitest';
import { toCumulative } from './sparkline-utils';
import { mergeChartLines } from './sparkline-series';

/** Точки новых пользователей за выбранный период. */
const points = [
  { date: '2026-10-07', count: 1 },
  { date: '2026-10-08', count: 1 },
  { date: '2026-10-09', count: 0 },
];

describe('Накопительный график', () => {
  it('учитывает аудиторию до периода и заканчивается общим числом', () => {
    expect(toCumulative(points, 7).map(point => point.count)).toEqual([6, 7, 7]);
    expect(points.map(point => point.count)).toEqual([1, 1, 0]);
  });

  it('суммирует сообщения от нуля, когда общий итог не передан', () => {
    expect(toCumulative(points).map(point => point.count)).toEqual([1, 2, 2]);
  });

  it('сохраняет аудиторию при отсутствии новых пользователей', () => {
    expect(toCumulative(points.map(point => ({ ...point, count: 0 })), 7)
      .map(point => point.count)).toEqual([7, 7, 7]);
  });

  it('сортирует точки перед накоплением без изменения входного массива', () => {
    const reversed = [...points].reverse();
    expect(toCumulative(reversed, 7)).toEqual(toCumulative(points, 7));
    expect(reversed[0].date).toBe('2026-10-09');
  });

  it('не сбрасывает серию на датах, присутствующих только в другой серии', () => {
    const lines = [
      { name: 'А', color: '#000', data: toCumulative([points[0], points[2]]) },
      { name: 'Б', color: '#fff', data: toCumulative([points[1]]) },
    ];
    expect(mergeChartLines(lines, true)).toEqual([
      { date: '2026-10-07', А: 1, Б: 0 },
      { date: '2026-10-08', А: 1, Б: 1 },
      { date: '2026-10-09', А: 1, Б: 1 },
    ]);
    expect(mergeChartLines(lines, false)).toEqual([
      { date: '2026-10-07', А: 1, Б: 0 },
      { date: '2026-10-08', А: 0, Б: 1 },
      { date: '2026-10-09', А: 1, Б: 0 },
    ]);
  });
});
