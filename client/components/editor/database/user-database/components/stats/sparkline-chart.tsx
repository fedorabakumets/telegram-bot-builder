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
import { fmtTick, getTickIndices, CustomTooltip } from './sparkline-utils';

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

  /** Форматтер тика с замыканием на granularity */
  const tickFormatter = (val: string) => fmtTick(val, granularity);

  /** Общий tooltip */
  const tooltipEl = (
    <Tooltip
      content={<CustomTooltip granularity={granularity} />}
      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
    />
  );

  /** Ось X с 3–4 тиками */
  const xAxis = (
    <XAxis
      dataKey="date"
      ticks={tickValues}
      tickFormatter={tickFormatter}
      tick={TICK_STYLE}
      axisLine={false}
      tickLine={false}
    />
  );

  /** Блок градиента */
  const gradientDef = (opacity0: number, opacity1: number) => (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={lineColor} stopOpacity={opacity0} />
        <stop offset="100%" stopColor={lineColor} stopOpacity={opacity1} />
      </linearGradient>
    </defs>
  );

  /** Тип графика по гранулярности */
  const isBar = granularity === '1m' || granularity === '5m';
  const showDots = granularity === '1h';

  if (isBar) {
    return (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={MARGIN}>
          {gradientDef(0.8, 0.3)}
          {xAxis}
          {tooltipEl}
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
        {gradientDef(0.3, 0)}
        {xAxis}
        {tooltipEl}
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
