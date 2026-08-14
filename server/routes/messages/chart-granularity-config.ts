/**
 * @fileoverview SQL-окна гранулярности графиков прироста и кнопок
 * @module server/routes/messages/chart-granularity-config
 */

/** Параметры DATE_TRUNC / generate_series для слотов графика */
export interface ChartSeriesGranularityConfig {
  /** Окно выборки для `INTERVAL` */
  window: string;
  /** Единица `DATE_TRUNC` */
  truncate: string;
  /** Шаг `generate_series` */
  step: string;
}

/**
 * 1m — час / минута; 5m — 3 часа / 5 мин; 1h — сутки / час;
 * 1w — 7 дней / день; 1d — 30 дней / день; 7d — 12 недель / неделя;
 * 30d — 12 месяцев / месяц.
 */
export const CHART_SERIES_GRANULARITY: Record<string, ChartSeriesGranularityConfig> = {
  "1m": { window: "1 hour", truncate: "minute", step: "1 minute" },
  "5m": { window: "3 hours", truncate: "minute", step: "5 minutes" },
  "1h": { window: "24 hours", truncate: "hour", step: "1 hour" },
  "1w": { window: "7 days", truncate: "day", step: "1 day" },
  "1d": { window: "30 days", truncate: "day", step: "1 day" },
  "7d": { window: "84 days", truncate: "week", step: "1 week" },
  "30d": { window: "365 days", truncate: "month", step: "1 month" },
};

/** Окно `INTERVAL` для popular-buttons (без truncate) */
export const CHART_WINDOW_INTERVAL: Record<string, string> = {
  "1m": "1 hour",
  "5m": "3 hours",
  "1h": "24 hours",
  "1w": "7 days",
  "1d": "30 days",
  "7d": "84 days",
  "30d": "365 days",
};

/**
 * Возвращает SQL-конфиг слотов или fallback
 * @param granularity - Значение query granularity
 * @param fallback - Ключ по умолчанию
 * @returns Конфиг окна, truncate и шага
 */
export function getChartSeriesGranularity(
  granularity: string | undefined,
  fallback = "1d",
): ChartSeriesGranularityConfig {
  return (
    CHART_SERIES_GRANULARITY[granularity ?? fallback] ??
    CHART_SERIES_GRANULARITY[fallback]
  );
}
