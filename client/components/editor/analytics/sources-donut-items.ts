/**
 * @fileoverview Элементы кольца «Источники трафика» из прироста и из всей аудитории
 * @module client/components/editor/analytics/sources-donut-items
 */

import { GrowthBySourcePoint } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { TrafficSource } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { StatBarItem } from '@/components/editor/database/user-database/components/stats/stat-bar-card';
import { sourceColorAt } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';

/**
 * Процент с одним знаком после запятой, как ROUND(..., 1) в SQL трафика
 * @param count - Число людей источника
 * @param total - Сумма по всем источникам
 * @returns Процент от 0 до 100
 */
export function roundSourcePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

/**
 * Складывает слоты прироста в доли кольца за выбранный срок
 * @param points - Точки GET /users/growth-by-source
 * @returns Источники по убыванию числа, с цветом легенды столбцов
 */
export function growthPointsToSourceItems(points: GrowthBySourcePoint[]): StatBarItem[] {
  const totals = new Map<string, number>();
  points.forEach((point) => {
    Object.entries(point.sources ?? {}).forEach(([name, raw]) => {
      const count = Number(raw) || 0;
      if (count <= 0) return;
      totals.set(name, (totals.get(name) ?? 0) + count);
    });
  });

  const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, entry) => sum + entry[1], 0);

  return ranked.map(([label, count], index) => ({
    label,
    count,
    percentage: roundSourcePercent(count, total),
    color: sourceColorAt(index),
  }));
}

/**
 * Вся аудитория из GET /users/traffic в элементы кольца
 * @param sources - Источники, уже отсортированные по убыванию
 * @returns Элементы с тем же цветом по месту в списке
 */
export function trafficSourcesToItems(sources: TrafficSource[]): StatBarItem[] {
  return sources.map((source, index) => ({
    label: source.param,
    count: source.count,
    percentage: source.percentage,
    color: sourceColorAt(index),
  }));
}
