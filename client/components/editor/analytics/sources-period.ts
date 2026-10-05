/**
 * @fileoverview Срок пары «Источники трафика»: окно графика или вся аудитория
 * @module client/components/editor/analytics/sources-period
 */

import { ChartGranularity } from '@/components/editor/database/user-database/hooks/queries/chart-granularity';

/** Окно прироста или вся аудитория без ограничения по времени */
export type SourcesPeriod = ChartGranularity | 'all';

/** Подпись срока под заголовком кольца */
export const SOURCES_PERIOD_CAPTIONS: Record<SourcesPeriod, string> = {
  '1m': 'за последний час',
  '5m': 'за 3 часа',
  '1h': 'за 24 часа',
  '1w': 'за 7 дней',
  '1d': 'за 30 дней',
  '7d': 'за 12 недель',
  '30d': 'за 12 месяцев',
  all: 'за всё время',
};

/**
 * Срок является окном прироста, а не всей аудиторией
 * @param period - Выбранный срок
 * @returns true, если это одно из семи окон графика
 */
export function isSourcesWindow(period: SourcesPeriod): period is ChartGranularity {
  return period !== 'all';
}
