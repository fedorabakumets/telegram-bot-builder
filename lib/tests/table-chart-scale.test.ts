/** @fileoverview Проверки читаемой шкалы диаграммы для малых, дробных и отрицательных значений. */
import { describe, expect, it } from 'vitest';
import { getTableChartScale } from '../../client/components/editor/analytics/table-chart/table-chart-scale';

describe('деления шкалы графика по таблице', () => {
  /** Единичные значения не растягивают шкалу до четырёх. */
  it('показывает только ноль и единицу для единичных значений', () => {
    expect(getTableChartScale([1, 1, 1])).toEqual({ domain: [0, 1], ticks: [0, 1] });
  });
  /** Нули и отсутствие значений дают конечную, ненулевую шкалу. */
  it('обрабатывает нулевой диапазон', () => {
    expect(getTableChartScale([0, 0]).domain).toEqual([0, 1]);
    expect(getTableChartScale([]).ticks).toEqual([0, 1]);
  });
  /** Дробные значения не округляются до целых делений. */
  it('сохраняет дробный шаг', () => {
    expect(getTableChartScale([0.1, 0.2])).toEqual({ domain: [0, 0.2], ticks: [0, 0.05, 0.1, 0.15, 0.2] });
  });
  /** Отрицательные числа помещаются в шкалу вместе с нулём. */
  it('включает отрицательные значения', () => {
    expect(getTableChartScale([-2, -1])).toEqual({ domain: [-2, 0], ticks: [-2, -1, 0] });
  });
  /** Верхняя граница остаётся понятным круглым числом и покрывает максимум. */
  it('строит редкие круглые деления для больших значений', () => {
    expect(getTableChartScale([105])).toEqual({ domain: [0, 150], ticks: [0, 50, 100, 150] });
  });
});
