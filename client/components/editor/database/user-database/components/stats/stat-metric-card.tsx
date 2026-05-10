/**
 * @fileoverview Числовая карточка статистики с Railway-стилем sparkline
 * @description Отображает заголовок, большое число, subtitle и график на всю ширину.
 *              Поддержка multi-line графиков с легендой для источников трафика.
 *              Поддержка ручного переключателя типа графика (bar/line).
 */

import React from 'react';
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
  /** Подпись рядом с заголовком, например "+8 за неделю" */
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
  /** Высота графика в пикселях (по умолчанию 80) */
  chartHeight?: number;
  /**
   * Явный тип графика: 'bar' — столбчатый, 'line' — линейный.
   * Если не задан — тип выбирается автоматически по гранулярности.
   */
  chartType?: ChartType;
}

/**
 * Форматирует число компактно: 1.2K, 3.4M и т.д.
 * @param v - Числовое значение
 * @returns Отформатированная строка
 */
function defaultFormat(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (!Number.isInteger(v)) return v.toFixed(1);
  return String(v);
}

/**
 * Бейдж тренда с иконкой и subtitle
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
    <div className="flex items-center gap-1 shrink-0">
      {icon}
      <span className={`text-xs whitespace-nowrap ${textColor}`}>{subtitle}</span>
    </div>
  );
}

/**
 * Числовая карточка статистики с Railway-стилем sparkline
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
    chartHeight,
    chartType,
  } = props;
  const fmt = formatValue ?? defaultFormat;
  const displayValue = value !== undefined ? fmt(value) : '—';

  /** Уникальный id градиента: из пропса или авто-генерация из заголовка */
  const gradientId = gradientIdProp ?? `sparkGrad-${title.replace(/\s+/g, '')}`;
  const hasChart = (!!sparklineData && sparklineData.length >= 2) || (!!multiLineData && multiLineData.length > 0);
  const isMultiLine = !!multiLineData && multiLineData.length > 0;

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3 min-w-0 overflow-hidden">
      {/* Шапка: заголовок + subtitle слева, переключатели справа */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
          <TrendIcon trend={trend} subtitle={subtitle} />
        </div>
        {headerExtra && (
          <div className="flex items-center gap-1 shrink-0">{headerExtra}</div>
        )}
      </div>

      {/* Большое числовое значение */}
      <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {displayValue}
      </span>

      {/* График на всю ширину карточки */}
      {hasChart && (
        <SparklineChart
          data={sparklineData}
          multiLineData={multiLineData}
          gradientId={gradientId}
          lineColor={lineColor}
          granularity={chartGranularity}
          cumulative={cumulative}
          height={chartHeight}
          chartType={chartType}
        />
      )}

      {/* Легенда для multi-line графика */}
      {isMultiLine && <SourceLegend items={multiLineData!} />}
    </div>
  );
}
