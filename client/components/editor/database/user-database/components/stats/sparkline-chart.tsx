/**
 * @fileoverview Sparkline-график прироста пользователей на базе recharts
 * @description BarChart для минутных данных, AreaChart с точками для часовых,
 *              AreaChart без точек для дневных/недельных/месячных периодов.
 */

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  Tooltip,
} from 'recharts';
import { GrowthPoint } from '../../hooks/queries/use-growth';
import { fmtTick, fmtTooltipDate, getTickIndices } from './sparkline-utils';

/**
 * Пропсы компонента SparklineChart
 */
export interface SparklineChartProps {
  /** Массив точек прироста */
  data: GrowthPoint[];
  /** Уникальный суффикс для id градиента */
  gradientId: string;
  /** Цвет линии и градиента (по умолчанию #3b82f6) */
  lineColor?: string;
  /** Гранулярность: '1m' | '5m' | '1h' | '1d' | '7d' | '30d' */
  granularity?: string;
}

/** Общий отступ графика */
const MARGIN = { top: 4, right: 4, bottom: 0, left: 0 };

/** Стиль тиков оси X */
const TICK_STYLE = { fontSize: 9, fill: 'rgba(255,255,255,0.4)' };

/**
 * Пропсы кастомного tooltip от recharts
 */
interface TooltipProps {
  /** Флаг активности tooltip */
  active?: boolean;
  /** Данные точки */
  payload?: Array<{ payload: GrowthPoint }>;
  /** Гранулярность для форматирования */
  granularity?: string;
}

/**
 * Рендерит кастомный tooltip для recharts
 * @param props - Пропсы от recharts + granularity
 * @returns JSX элемент tooltip или null
 */
function renderTooltip(granularity?: string) {
  /**
   * Внутренний компонент tooltip
   * @param props - Пропсы от recharts
   * @returns JSX или null
   */
  return function TooltipContent({ active, payload }: TooltipProps): React.JSX.Element | null {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
      <div className="bg-popover border rounded-md px-2 py-1 text-xs shadow-md">
        <span className="opacity-60">{fmtTooltipDate(point.date, granularity)}</span>
        <span className="ml-2 font-bold">{point.count}</span>
      </div>
    );
  };
}

/**
 * Sparkline-график прироста пользователей (recharts)
 * @param props - Свойства компонента
 * @returns JSX элемент графика или null если данных недостаточно
 */
export function SparklineChart({
  data,
  gradientId,
  lineColor = '#3b82f6',
  granularity,
}: SparklineChartProps): React.JSX.Element | null {
  if (!data || data.length < 2) return null;

  const tickIndices = getTickIndices(data.length);
  const tickValues = tickIndices.map(i => data[i].date);

  /** Тип графика по гранулярности */
  const isBar = granularity === '1m' || granularity === '5m';
  const showDots = granularity === '1h';

  /** Компонент tooltip — создаётся один раз на рендер */
  const TooltipContent = renderTooltip(granularity);

  const sharedChildren = (
    <>
      <XAxis
        dataKey="date"
        ticks={tickValues}
        tickFormatter={(val: string) => fmtTick(val, granularity)}
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        content={TooltipContent}
        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
      />
    </>
  );

  if (isBar) {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.8} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          {sharedChildren}
          <Bar
            dataKey="count"
            fill={`url(#${gradientId})`}
            barSize={4}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={MARGIN}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {sharedChildren}
        <Area
          type="monotone"
          dataKey="count"
          stroke={lineColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={showDots ? { r: 2, fill: lineColor, strokeWidth: 0 } : false}
          activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
