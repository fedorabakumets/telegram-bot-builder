/**
 * @fileoverview Sparkline-график прироста пользователей на базе recharts
 * @description BarChart для минутных данных, AreaChart с точками для часовых,
 *              AreaChart без точек для дневных/недельных/месячных периодов.
 *              Поддержка multi-line режима и ручного переключателя типа графика.
 */

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { GrowthPoint } from '../../hooks/queries/use-growth';
import { fmtTick, fmtTooltipDate, getTickIndices, toCumulative } from './sparkline-utils';
import { ChartType } from './chart-type-toggle';

/**
 * Данные для одной линии в multi-line режиме
 */
export interface MultiLineData {
  /** Название линии (источника) */
  name: string;
  /** Массив точек прироста */
  data: GrowthPoint[];
  /** Цвет линии */
  color: string;
}

/**
 * Пропсы компонента SparklineChart
 */
export interface SparklineChartProps {
  /** Массив точек прироста (для single-line режима) */
  data?: GrowthPoint[];
  /** Массив данных для multi-line режима (несколько источников) */
  multiLineData?: MultiLineData[];
  /** Уникальный суффикс для id градиента */
  gradientId: string;
  /** Цвет линии и градиента (по умолчанию #3b82f6, только для single-line) */
  lineColor?: string;
  /** Гранулярность: '1m' | '5m' | '1h' | '1d' | '7d' | '30d' */
  granularity?: string;
  /** Накопительный режим: данные суммируются нарастающим итогом */
  cumulative?: boolean;
  /** Высота графика в пикселях (по умолчанию 80) */
  height?: number;
  /**
   * Явный тип графика: 'bar' — столбчатый, 'line' — линейный (Area).
   * Если не задан — тип выбирается автоматически по гранулярности.
   * cumulative всегда принудительно использует AreaChart.
   */
  chartType?: ChartType;
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
  payload?: Array<{ payload: any; dataKey: string; color: string; name?: string }>;
  /** Гранулярность для форматирования */
  granularity?: string;
  /** Флаг multi-line режима */
  isMultiLine?: boolean;
}

/**
 * Рендерит кастомный tooltip для recharts
 * @param granularity - Гранулярность для форматирования
 * @param isMultiLine - Флаг multi-line режима
 * @returns Компонент tooltip
 */
function renderTooltip(granularity?: string, isMultiLine?: boolean) {
  /**
   * Внутренний компонент tooltip
   * @param props - Пропсы от recharts
   * @returns JSX или null
   */
  return function TooltipContent({ active, payload }: TooltipProps): React.JSX.Element | null {
    if (!active || !payload?.length) return null;

    // Multi-line режим: показываем все источники
    if (isMultiLine) {
      const date = payload[0].payload.date;
      return (
        <div className="bg-popover border rounded-md px-2 py-1 text-xs shadow-md">
          <div className="opacity-60 mb-1">{fmtTooltipDate(date, granularity)}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="opacity-80">{entry.name}:</span>
              <span className="font-bold">{entry.payload[entry.dataKey]}</span>
            </div>
          ))}
        </div>
      );
    }

    // Single-line режим: показываем одно значение
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
 * Создаёт рендерер точки только для последнего элемента линии
 * @param color - Цвет точки
 * @param dataLength - Длина массива данных
 * @returns Функция-рендерер для prop `dot` компонента Area
 */
function renderLastDot(color: string, dataLength: number) {
  return function LastDot(props: any): React.JSX.Element | null {
    const { cx, cy, index } = props;
    if (index !== dataLength - 1) return null;
    return <circle cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
  };
}

/**
 * Sparkline-график прироста пользователей (recharts)
 * @param props - Свойства компонента
 * @returns JSX элемент графика или null если данных недостаточно
 */
export function SparklineChart({
  data,
  multiLineData,
  gradientId,
  lineColor = '#3b82f6',
  granularity,
  cumulative,
  height = 80,
  chartType,
}: SparklineChartProps): React.JSX.Element | null {
  // Multi-line режим
  if (multiLineData && multiLineData.length > 0) {
    // Объединяем все точки из всех источников в один массив для оси X
    const allDates = new Set<string>();
    multiLineData.forEach(line => {
      line.data.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Создаём объединённый массив данных для recharts
    const chartData = sortedDates.map(date => {
      const dataPoint: any = { date };
      multiLineData.forEach(line => {
        const point = line.data.find(p => p.date === date);
        dataPoint[line.name] = point?.count ?? 0;
      });
      return dataPoint;
    });

    if (chartData.length < 2) return null;

    const tickIndices = getTickIndices(chartData.length);
    const tickValues = tickIndices.map(i => chartData[i].date);
    const TooltipContent = renderTooltip(granularity, true);

    /**
     * Определяем тип графика для multi-line:
     * - cumulative всегда Area
     * - явный chartType перекрывает автоматику
     * - автоматика: 1m|5m → Bar, иначе → Area
     */
    const autoBar = !cumulative && (granularity === '1m' || granularity === '5m');
    const isMultiBar = !cumulative && (chartType === 'bar' || (chartType === undefined && autoBar));

    /** Stacked bar chart для коротких гранулярностей (1м, 5м) */
    if (isMultiBar) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={MARGIN} barCategoryGap="8%">
            <YAxis hide domain={['auto', 'auto']} />
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
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            {multiLineData.map((line, idx) => (
              <Bar
                key={line.name}
                dataKey={line.name}
                stackId="sources"
                fill={line.color}
                fillOpacity={idx === 0 ? 0.9 : 0.75}
                radius={idx === multiLineData.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={MARGIN}>
          <defs>
            {multiLineData.map(line => (
              <linearGradient key={`${gradientId}-${line.name}`} id={`${gradientId}-${line.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {/* Скрытая ось Y для корректного масштабирования пиков */}
          <YAxis hide domain={['auto', 'auto']} />
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
            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
          />
          {multiLineData.map((line, idx) => (
            <Area
              key={line.name}
              type="monotone"
              dataKey={line.name}
              stroke={line.color}
              strokeWidth={idx === 0 ? 2 : 1.5}
              fill={`url(#${gradientId}-${line.name})`}
              dot={renderLastDot(line.color, chartData.length)}
              activeDot={{ r: idx === 0 ? 4 : 3, fill: line.color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Single-line режим (оригинальная логика)
  if (!data || data.length < 2) return null;

  /** Применяем накопительное преобразование если нужно */
  const chartData = cumulative ? toCumulative(data) : data;

  const tickIndices = getTickIndices(chartData.length);
  const tickValues = tickIndices.map(i => chartData[i].date);

  /**
   * Определяем тип графика для single-line:
   * - cumulative всегда Area
   * - явный chartType перекрывает автоматику
   * - автоматика: 1m|5m → Bar, иначе → Area
   */
  const autoBar = !cumulative && (granularity === '1m' || granularity === '5m');
  const isBar = !cumulative && (chartType === 'bar' || (chartType === undefined && autoBar));
  const showDots = !isBar && !cumulative && granularity === '1h';

  /** Компонент tooltip — создаётся один раз на рендер */
  const TooltipContent = renderTooltip(granularity, false);

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
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={MARGIN} barCategoryGap="8%">
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
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={MARGIN}>
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
