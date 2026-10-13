/** @fileoverview Правила группировки, пояснений и рекомендации графика таблицы. */
import { describe, expect, it } from 'vitest';
import { aggregateTableData, isNumericColumn } from '../../shared/analytics/table-chart/aggregate';
import { suggestTableChart } from '../../shared/analytics/table-chart/suggest';
import { tableChartWarnings } from '../../shared/analytics/table-chart/warnings';

describe('Подсчёт графика таблицы', () => {
  const rows = [
    { data: { '10': 'a', '13': '12abc' } }, { data: { '10': 'a', '13': '1e2' } },
    { data: { '10': 'b', '13': '3' } }, { data: { '10': '   ', '13': '.5' } }, { data: { '10': 'b', '13': '' } },
  ];
  it('сохраняет пустую категорию, сумму распознанных чисел и ноль без чисел', () => {
    expect(aggregateTableData(rows, '10', '13', 'sum')).toEqual([{ label: 'a', value: 112 }, { label: 'b', value: 3 }, { label: '—', value: 0.5 }]);
    expect(aggregateTableData([{ data: { '10': 'a', '13': 'нет' } }], '10', '13', 'avg')).toEqual([{ label: 'a', value: 0 }]);
  });
  it('считает среднее только по числам и количество по всем строкам', () => {
    expect(aggregateTableData(rows, '10', '13', 'avg').find(point => point.label === 'a')?.value).toBe(56);
    expect(aggregateTableData(rows, '10', '13', 'count')).toEqual([{ label: 'a', value: 2 }, { label: 'b', value: 2 }, { label: '—', value: 1 }]);
  });
  it('определяет числовой столбец по порогу 80% и оставляет 50 групп', () => {
    expect(isNumericColumn(rows, '13')).toBe(true);
    expect(isNumericColumn([{ data: { '13': 'нет' } }, { data: { '13': 'нет' } }, { data: { '13': '1' } }, { data: { '13': '2' } }, { data: { '13': '3' } }], '13')).toBe(false);
    const many = Array.from({ length: 51 }, (_, index) => ({ data: { '10': `k${String(index).padStart(2, '0')}` } }));
    expect(aggregateTableData(many, '10', '10', 'count')).toHaveLength(50);
  });
  it('поясняет сокращение, неповторяющиеся и длинные подписи', () => {
    expect(tableChartWarnings({ groupCount: 51, rowCount: 51, avgLabelLength: 40, coercedToCount: true })).toEqual([
      'Столбец значения не числовой, поэтому посчитано количество строк.',
      'Показаны 50 групп с наибольшими значениями из 51.',
      'Большинство значений категории не повторяются, поэтому график трудно читать.',
      'Подписи категорий длинные и могут накладываться друг на друга.',
    ]);
  });
  it('рекомендует повторяющийся столбец вместо длинных уникальных ключей', () => {
    const suggestion = suggestTableChart([
      { id: 1, name: 'key', filled: 20, distinctCount: 20, avgLength: 48, isNumeric: false },
      { id: 2, name: 'type', filled: 20, distinctCount: 3, avgLength: 5, isNumeric: false },
    ], 20);
    expect(suggestion).toMatchObject({ xColumnId: 2, yColumnId: 2, aggregation: 'count', chartType: 'pie' });
    expect(suggestion.reason).toContain('type');
  });
  it('для одного числового столбца не выдумывает сумму по нему же', () => {
    expect(suggestTableChart([], 0).reason).toContain('нет столбцов');
    expect(suggestTableChart([{ id: 5, name: 'amount', filled: 4, distinctCount: 4, avgLength: 2, isNumeric: true }], 4).aggregation).toBe('count');
  });
});
