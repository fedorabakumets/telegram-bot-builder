/**
 * @fileoverview Числовая карточка статистики с Railway-стилем sparkline
 * @description Отображает заголовок, большое число, subtitle и график на всю ширину.
 *              Поддержка multi-line графиков с легендой для источников трафика.
 *              Поддержка ручного переключателя типа графика (bar/line).
 */

import React from 'react';
import { AnalyticsChartState } from '@/components/editor/analytics/analytics-chart-state';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GrowthPoint } from '../../hooks/queries/use-growth';
import { SparklineChart, MultiLineData } from './sparkline-chart';
import { SourceLegend } from './source-legend';
import { ChartType } from './chart-type-toggle';

/**
 * Пропсы компонента StatMetricCard
 */
export interface StatMetricCardProps {
  /** Заголовок карточки */
  title: string;
  /** Числовое значение для отображения */
  value: number | undefined;
  /** Подпись рядом с заголовком, например "+8 за период, 8 окт. — 15 окт." */
  subtitle?: string;
  /** Направление тренда */
  trend?: 'up' | 'down' | 'neutral';
  /** Данные для sparkline-графика (single-line режим) */
  sparklineData?: GrowthPoint[];
  /** Данные для multi-line графика (несколько источников) */
  multiLineData?: MultiLineData[];
  /** Функция форматирования значения */
  formatValue?: (v: number) => string;
  /** Уникальный id градиента для sparkline (переопределяет авто-генерацию) */
  gradientId?: string;
  /** Цвет линии sparkline (по умолчанию синий #3b82f6) */
  lineColor?: string;
  /** Дополнительный элемент под заголовком (например переключатель периода) */
  headerExtra?: React.ReactNode;
  /** Гранулярность для правильного форматирования дат на графике */
  chartGranularity?: string;
  /** Накопительный режим: данные суммируются нарастающим итогом */
  cumulative?: boolean;
  /** Общее число для одиночной накопительной серии, включая значения до периода */
  cumulativeTotal?: number;
  /** Высота графика в пикселях (по умолчанию 80) */
  chartHeight?: number;
  /**
   * Явный тип графика: 'bar' — столбчатый, 'line' — линейный.
   * Если не задан — тип выбирается автоматически по гранулярности.
   */
  chartType?: ChartType;
  /**
   * Если true — заголовок с числом отображается над переключателями (stackHeader layout).
   * По умолчанию false — заголовок и переключатели в одной строке.
   */
  stackHeader?: boolean;
  /** Дополнительная подпись под числом (не зависит от тренда) */
  secondarySubtitle?: string;
  /** Блок под числом / над графиком (счётчики, пояснения) */
  footerExtra?: React.ReactNode;
  /** Спойлер «Что это за график?» */
  info?: React.ReactNode;
  /** Разделяет нижнюю область и пояснение для выравнивания парных карточек. */
  alignRows?: boolean;
}

/**
 * Форматирует точные значения по русским правилам и сокращает миллионы.
 * @param v - Числовое значение
 * @returns Отформатированная строка
 */
function defaultFormat(v: number): string {
  return v.toLocaleString('ru-RU', { maximumFractionDigits: 1,
    ...(v >= 1_000_000 ? { notation: 'compact' as const } : {}) });
}

/**
 * Подпись изменения за период с отдельным оформлением для аналитики.
 * @param trend - Направление тренда
 * @param subtitle - Текст подписи
 * @returns JSX или null
 */
function TrendIcon({ trend, subtitle }: { trend?: 'up' | 'down' | 'neutral'; subtitle?: string }) {
  if (!subtitle) return null;
  const icon = trend === 'up'
    ? <TrendingUp className="w-3 h-3 text-emerald-500" />
    : trend === 'down'
      ? <TrendingDown className="w-3 h-3 text-rose-500" />
      : null;
  const textColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';
  return (
    <div className="metric-trend flex items-center gap-1 shrink-0">
      {icon}
      <span className={`text-xs whitespace-nowrap ${textColor}`}>{subtitle}</span>
    </div>
  );
}

/**
 * Числовая карточка с графиком, состоянием загрузки и пояснением под данными.
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatMetricCard(props: StatMetricCardProps): React.JSX.Element {
  const {
    title,
    value,
    subtitle,
    trend,
    sparklineData,
    multiLineData,
    formatValue,
    gradientId: gradientIdProp,
    lineColor,
    headerExtra,
    chartGranularity,
    cumulative,
    cumulativeTotal,
    chartHeight,
    chartType,
    stackHeader,
    secondarySubtitle,
    footerExtra,
    info,
    alignRows,
  } = props;
  const fmt = formatValue ?? defaultFormat;
  const displayValue = value !== undefined ? fmt(value) : '—';

  /** Уникальный id градиента: из пропса или авто-генерация из заголовка */
  const gradientId = gradientIdProp ?? `sparkGrad-${title.replace(/\s+/g, '')}`;
  const hasChart = (!!sparklineData && sparklineData.length >= 2) || (!!multiLineData && multiLineData.length > 0);
  const isMultiLine = !!multiLineData && multiLineData.length > 0;

  return (
    <div className="analytics-card bg-background border rounded-xl p-3 flex flex-col gap-3 min-w-0 overflow-hidden">
      {stackHeader ? (
        /* Стек-режим: заголовок + число сверху, переключатели снизу */
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="metric-title-line flex items-center gap-2 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
              <TrendIcon trend={trend} subtitle={subtitle} />
            </div>
            <span className="metric-value text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none shrink-0">
              {value === undefined ? <span className="analytics-value-skeleton inline-block h-8 w-24 rounded-lg bg-muted" aria-label="Загрузка показателя" /> : displayValue}
            </span>
          </div>
          {headerExtra && (
            <div className="metric-controls flex flex-wrap items-center gap-1">{headerExtra}</div>
          )}
        </>
      ) : (
        /* Обычный режим: заголовок сверху, переключатели переносятся при нехватке места */
        <div className="flex flex-col gap-2">
          <div className="metric-heading flex items-center justify-between gap-2 flex-wrap">
            <div className="metric-title-line flex items-center gap-2 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
              <TrendIcon trend={trend} subtitle={subtitle} />
            </div>
          </div>
        </div>
      )}

      {/* Большое числовое значение (только в обычном режиме) */}
      {!stackHeader && (
        <div className="metric-number flex flex-wrap items-baseline gap-2">
          <span className="metric-value text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none">
            {value === undefined ? <span className="analytics-value-skeleton inline-block h-8 w-24 rounded-lg bg-muted" aria-label="Загрузка показателя" /> : displayValue}
          </span>
          {secondarySubtitle && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">{secondarySubtitle}</span>
          )}
        </div>
      )}


      {!stackHeader && headerExtra && <div className="metric-controls flex flex-wrap items-center gap-1">{headerExtra}</div>}
      {/* График на всю ширину карточки */}
      {hasChart && (
        <SparklineChart
          data={sparklineData}
          multiLineData={multiLineData}
          gradientId={gradientId}
          lineColor={lineColor}
          granularity={chartGranularity}
          cumulative={cumulative}
          cumulativeTotal={cumulativeTotal}
          height={chartHeight}
          chartType={chartType}
        />
      )}

      {!hasChart && <AnalyticsChartState loading={value === undefined} description="Данные появятся после первых взаимодействий с ботом. Попробуйте выбрать другой период." />}
      {alignRows ? <>
        <div className="metric-bottom-content space-y-4">{footerExtra}{isMultiLine && <SourceLegend items={multiLineData!} />}</div>
        <div className="metric-bottom-info">{info}</div>
      </> : <>{footerExtra}{info}{isMultiLine && <SourceLegend items={multiLineData!} />}</>}

    </div>
  );
}
