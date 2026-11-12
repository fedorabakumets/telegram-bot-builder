/** @fileoverview Проверяет разрывы истории и сохранение настоящего нулевого замера. */
import { describe, expect, it } from 'vitest';
import { workerChartPoints } from './worker-chart-points';
import { workerMemory } from './worker-monitor-format';
/** Создаёт минимальную измеренную точку без пользовательских данных. */
const sample = (sampledAt: string, pythonRssBytes: number | null) => ({ sampledAt, pythonRssBytes,
  nodeRssBytes: 1048576, activeHandlers: 0, sleepingBots: 6, waitingBots: 0 });
describe('Достоверность графика памяти', () => {
  it('сохраняет ноль и не подменяет отсутствие измерения', () => {
    const points = workerChartPoints([sample('2026-11-12T10:00:00Z', 0), sample('2026-11-12T10:00:10Z', null)]);
    expect(points[0].python).toBe(0);
    expect(points[1].python).toBeNull();
    expect(workerMemory(0)).toBe('0 МиБ');
    expect(workerMemory(null)).toBe('Нет замера');
  });
  it('разрывает линию при пропущенных опросах', () => {
    const points = workerChartPoints([sample('2026-11-12T10:00:00Z', 1048576), sample('2026-11-12T10:01:00Z', 1048576)]);
    expect(points).toHaveLength(3);
    expect(points[1]).toMatchObject({ node: null, python: null });
    expect(points[2].python).toBe(1);
  });
});
