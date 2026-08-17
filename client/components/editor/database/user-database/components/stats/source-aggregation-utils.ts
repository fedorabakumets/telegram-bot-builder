/**
 * @fileoverview Утилиты для агрегации источников трафика
 * @description Преобразование данных по источникам в формат для multi-line графика
 */

import { GrowthBySourcePoint } from '../../hooks/queries/use-growth-by-source';
import { GrowthPoint } from '../../hooks/queries/use-growth';

/**
 * Цветовая палитра для источников трафика
 */
export const SOURCE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#a855f7', // purple
  '#14b8a6', // teal
  '#e11d48', // rose
  '#6366f1', // indigo
  '#22c55e', // green
  '#eab308', // yellow
  '#6b7280', // gray (для "Остальные" / хвост)
];

/**
 * Цвет источника по индексу (цикл палитры без финального серого, пока есть запас)
 * @param index - Порядковый номер источника
 * @returns HEX-цвет
 */
export function sourceColorAt(index: number): string {
  const palette = SOURCE_COLORS.slice(0, -1);
  return palette[index % palette.length] ?? SOURCE_COLORS[0];
}

/**
 * Данные для одной линии на multi-line графике
 */
export interface MultiLineData {
  /** Название источника */
  name: string;
  /** Массив точек прироста */
  data: GrowthPoint[];
  /** Цвет линии */
  color: string;
}

/**
 * Вычисляет суммарное количество пользователей по источнику за весь период
 * @param points - Массив точек прироста по источникам
 * @param sourceName - Название источника
 * @returns Суммарное количество
 */
function getTotalForSource(points: GrowthBySourcePoint[], sourceName: string): number {
  return points.reduce((sum, point) => sum + (point.sources[sourceName] ?? 0), 0);
}

/**
 * Получает список всех уникальных источников из массива точек
 * @param points - Массив точек прироста по источникам
 * @returns Массив названий источников
 */
function getAllSources(points: GrowthBySourcePoint[]): string[] {
  const sourcesSet = new Set<string>();
  points.forEach(point => {
    Object.keys(point.sources).forEach(source => sourcesSet.add(source));
  });
  return Array.from(sourcesSet);
}

/**
 * Агрегирует данные по источникам: топ-N + группа "Остальные"
 * @param points - Массив точек прироста по источникам
 * @param limit - Количество топ-источников (по умолчанию 5)
 * @returns Массив данных для multi-line графика
 */
export function aggregateTopSources(
  points: GrowthBySourcePoint[],
  limit: number = 5
): MultiLineData[] {
  if (!points || points.length === 0) return [];

  // Получаем все источники и их суммарные значения
  const allSources = getAllSources(points);
  const sourceTotals = allSources.map(source => ({
    name: source,
    total: getTotalForSource(points, source),
  }));

  // Сортируем по убыванию и берём топ-N
  sourceTotals.sort((a, b) => b.total - a.total);
  const topSources = sourceTotals.slice(0, limit);
  const topSourceNames = new Set(topSources.map(s => s.name));

  // Формируем данные для каждого топ-источника
  const result: MultiLineData[] = topSources.map((source, index) => ({
    name: source.name,
    color: sourceColorAt(index),
    data: points.map(point => ({
      date: point.date,
      count: point.sources[source.name] ?? 0,
    })),
  }));

  // Если есть источники вне топа — добавляем группу "Остальные"
  if (Number.isFinite(limit) && sourceTotals.length > limit) {
    const othersData: GrowthPoint[] = points.map(point => {
      const othersCount = Object.entries(point.sources)
        .filter(([source]) => !topSourceNames.has(source))
        .reduce((sum, [, count]) => sum + count, 0);
      return {
        date: point.date,
        count: othersCount,
      };
    });

    result.push({
      name: 'Остальные',
      color: '#8b5cf6',
      data: othersData,
    });
  }

  return result;
}
