/**
 * @fileoverview Общие тип, метки и polling гранулярности графиков аналитики
 * @module client/components/editor/database/user-database/hooks/queries/chart-granularity
 */

/** Query `granularity` для прироста, активности, источников и кнопок */
export type ChartGranularity = '1m' | '5m' | '1h' | '1w' | '1d' | '7d' | '30d';

/** Порядок кнопок: 1ч → 3ч → 24ч → 7д → 30д → 12н → 12м */
export const CHART_GRANULARITY_ORDER: ChartGranularity[] = [
  '1m', '5m', '1h', '1w', '1d', '7d', '30d',
];

/** Короткий период охвата на кнопке */
export const CHART_GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  '1m': '1ч',
  '5m': '3ч',
  '1h': '24ч',
  '1w': '7д',
  '1d': '30д',
  '7d': '12н',
  '30d': '12м',
};

/** Подсказка: окно и шаг */
export const CHART_GRANULARITY_TITLES: Record<ChartGranularity, string> = {
  '1m': 'Последний час, шаг 1 минута',
  '5m': 'Последние 3 часа, шаг 5 минут',
  '1h': 'Последние 24 часа, шаг 1 час',
  '1w': 'Последние 7 дней, шаг 1 день',
  '1d': 'Последние 30 дней, шаг 1 день',
  '7d': 'Последние 12 недель, шаг 1 неделя',
  '30d': 'Последние 12 месяцев, шаг 1 месяц',
};

/**
 * Интервал автообновления: короткие окна чаще, длинные — по WS
 * @param granularity - Текущая гранулярность
 * @returns Интервал в мс или false
 */
export function getChartGranularityRefetchInterval(
  granularity: ChartGranularity | undefined,
): number | false {
  switch (granularity) {
    case '1m': return 30_000;
    case '5m': return 60_000;
    case '1h': return 120_000;
    case '1w':
    case '1d': return 300_000;
    default: return false;
  }
}
