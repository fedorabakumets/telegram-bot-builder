/**
 * @fileoverview Объединение временных серий с сохранением накопленных значений
 */

import type { MultiLineData } from './sparkline-chart';

/** Точка объединённого графика с датой и значениями источников. */
export interface MergedChartPoint {
  /** Дата точки графика. */
  date: string;
  /** Числовые значения серий и строковая дата. */
  [key: string]: number | string;
}

/**
 * Выравнивает серии по общей шкале дат без сброса накопленного итога.
 * @param lines - Серии, уже преобразованные в выбранный режим
 * @param cumulative - Нужно ли переносить последнее значение на пропуски
 * @returns Хронологические точки для отображения нескольких серий
 */
export function mergeChartLines(lines: MultiLineData[], cumulative = false): MergedChartPoint[] {
  const dates = [...new Set(lines.flatMap(line => line.data.map(point => point.date)))].sort();
  const values = lines.map(line => new Map(line.data.map(point => [point.date, point.count])));
  const previous = lines.map(() => 0);
  return dates.map(date => {
    const point: MergedChartPoint = { date };
    lines.forEach((line, index) => {
      const count = values[index].get(date) ?? (cumulative ? previous[index] : 0);
      point[line.name] = count;
      previous[index] = count;
    });
    return point;
  });
}
