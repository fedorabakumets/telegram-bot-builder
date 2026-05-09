/**
 * @fileoverview Числовая карточка статистики с Railway-стилем sparkline
 * @description Отображает заголовок, большое число, subtitle и график на всю ширину.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GrowthPoint } from '../../hooks/queries/use-growth';
import { SparklineChart } from './sparkline-chart';

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
  /** Данные для sparkline-графика */
  sparklineData?: GrowthPoint[];
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
 * Иконка тренда по направлению
 * @param props - Пропсы с направлением тренда
 * @returns JSX иконка
 */
function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-rose-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

/**
 * Числовая карточка статистики с Railway-стилем sparkline
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatMetricCard(props: StatMetricCardProps): React.JSX.Element {
  const { title, value, subtitle, trend, sparklineData, formatValue, gradientId: gradientIdProp, lineColor, headerExtra, chartGranularity, cumulative } = props;
  const fmt = formatValue ?? defaultFormat;
  const displayValue = value !== undefined ? fmt(value) : '—';

  /** Уникальный id градиента: из пропса или авто-генерация из заголовка */
  const gradientId = gradientIdProp ?? `sparkGrad-${title.replace(/\s+/g, '')}`;
  const hasChart = !!sparklineData && sparklineData.length >= 2;

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-2 min-w-0 overflow-hidden">
      {/* Строка заголовка с subtitle справа */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
        {subtitle && (
          <div className="flex items-center gap-1 shrink-0">
            <TrendIcon trend={trend} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{subtitle}</span>
          </div>
        )}
      </div>

      {/* Дополнительный элемент под заголовком (например переключатель периода) */}
      {headerExtra && (
        <div>{headerExtra}</div>
      )}

      {/* Большое числовое значение */}
      <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {displayValue}
      </span>

      {/* График на всю ширину карточки */}
      {hasChart && (
        <SparklineChart data={sparklineData!} gradientId={gradientId} lineColor={lineColor} granularity={chartGranularity} cumulative={cumulative} />
      )}
    </div>
  );
}
