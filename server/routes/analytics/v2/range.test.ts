/** @fileoverview Проверки полного исторического окна, временной зоны и строгих границ. */
import { describe, expect, it } from 'vitest';
import { resolveV2Range, previousV2Range } from './range';
import { v2BucketCount } from './buckets';
const now = Date.parse('2026-11-02T12:00:00Z');
describe('Диапазоны аналитики v2', () => {
  it('сохраняет UTC и отдельно задаёт пояс отображения', () => {
    const range = resolveV2Range({ period: '7d', timezone: 'Europe/Moscow' }, now, null);
    expect(range).toMatchObject({ from: '2026-10-26T12:00:00.000Z', to: '2026-11-02T12:00:00.000Z', timezone: 'Europe/Moscow', step_ms: 86400000 });
    expect(previousV2Range(range).to).toBe(range.from);
  });
  it('показывает двадцать лет целиком с ограниченным числом точек', () => {
    const range = resolveV2Range({ period: 'all' }, now, '2006-01-01T00:00:00Z');
    expect(range.from).toBe('2006-01-01T00:00:00.000Z');
    expect(v2BucketCount(Date.parse(range.from), now, range.step_ms)).toBeLessThanOrEqual(500);
  });
  it('учитывает дополнительный крайний интервал при подборе шага всего времени', () => {
    const from = Date.parse('2026-10-01T00:00:30Z');
    const to = from + 500 * 60000;
    const range = resolveV2Range({ period: 'all' }, to, new Date(from).toISOString());
    expect(range.step_ms).toBe(300000);
    expect(v2BucketCount(from, to, range.step_ms)).toBeLessThanOrEqual(500);
    expect(() => resolveV2Range({ period: 'all', step: '1m' }, to, new Date(from).toISOString())).toThrow();
  });
  it('отклоняет ложный пояс, лишние даты и слишком мелкий шаг', () => {
    expect(() => resolveV2Range({ timezone: 'Unknown/Zone' }, now, null)).toThrow();
    expect(() => resolveV2Range({ period: 'all', from: '2026-01-01' }, now, null)).toThrow();
    expect(() => resolveV2Range({ period: 'all', step: '1m' }, now, '2020-01-01')).toThrow();
  });
});
