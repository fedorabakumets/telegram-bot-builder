/**
 * @fileoverview Карточка-график динамики источников трафика
 * @description Stacked bar chart или Area chart с переключателем типа и периодов,
 *              интерактивной легендой и WS real-time обновлениями.
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';
import { fmtTick, fmtTooltipDate, getTickIndices } from '@/components/editor/database/user-database/components/stats/sparkline-utils';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import { ChartTypeToggle, ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';

/**
 * Пропсы компонента AnalyticsSourcesChart
 */
export interface AnalyticsSourcesChartProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/** Метки кнопок переключателя периодов */
const PERIOD_LABELS: Record<GrowthGranularity, string> = {
  '1m':  '1ч',
  '5m':  '3ч',
  '1h':  '24ч',
  '1d':  '30д',
  '7d':  '12н',
  '30d': '12м',
};

/** Порядок кнопок переключателя */
const PERIOD_ORDER: GrowthGranularity[] = ['1m', '5m', '1h', '1d', '7d', '30d'];

/**
 * Кастомный tooltip для stacked bar графика источников
 * @param props - Пропсы от recharts + гранулярность
 * @returns JSX элемент tooltip или null
 */
function SourcesTooltip({ active, payload, granularity }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number; payload: any }>;
  granularity?: string;
}): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  /** Фильтруем нулевые значения — не показываем пустые источники */
  const nonZero = payload.filter(e => e.value > 0);
  if (!nonZero.length) return null;
  return (
    <div className="bg-popover border rounded-md px-2 py-1.5 text-xs shadow-md min-w-[120px]">
      <div className="opacity-60 mb-1.5 text-[10px]">{fmtTooltipDate(date, granularity)}</div>
      {nonZero.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="opacity-80">{entry.dataKey}</span>
          </div>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Карточка-график динамики источников трафика с переключателем периодов,
 * интерактивной легендой и WS real-time обновлениями.
 * @param props - Свойства компонента
 * @returns JSX элемент карточки
 */
export function AnalyticsSourcesChart({ projectId, selectedTokenId }: AnalyticsSourcesChartProps): React.JSX.Element {
  /** Текущая гранулярность графика */
  const [granularity, setGranularity] = useState<GrowthGranularity>('1d');
  /** Тип графика: столбчатый или линейный */
  const [chartType, setChartType] = useState<ChartType>('bar');
  /** Множество скрытых источников (по имени) */
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  /** Подписка на WS-событие new-user — инвалидация кэша источников */
  useEffect(() => {
    if (!liveContext) return;
    return liveContext.subscribe((event) => {
      if (event.type === 'new-user' && event.projectId === projectId) {
        queryClient.invalidateQueries({ queryKey: ['users-growth-by-source', projectId, selectedTokenId] });
      }
    });
  }, [liveContext, projectId, selectedTokenId, queryClient]);

  const { points, isLoading } = useGrowthBySource({ projectId, selectedTokenId, granularity });
  const multiLineData = aggregateTopSources(points, 6);

  /** Суммарное число пользователей за период по всем источникам */
  const totalForPeriod = multiLineData.reduce((sum, line) => sum + line.data.reduce((s, p) => s + p.count, 0), 0);

  /** Данные только видимых источников (не скрытых легендой) */
  const visibleData = multiLineData.filter(d => !hiddenSources.has(d.name));

  // Собираем все уникальные даты из visibleData
  const allDates = new Set<string>();
  visibleData.forEach(line => line.data.forEach(p => allDates.add(p.date)));
  const sortedDates = Array.from(allDates).sort();

  /** Объединённый массив точек для recharts */
  const chartData = sortedDates.map(date => {
    const point: Record<string, any> = { date };
    visibleData.forEach(line => {
      const p = line.data.find(d => d.date === date);
      point[line.name] = p?.count ?? 0;
    });
    return point;
  });

  const tickIndices = getTickIndices(chartData.length);
  const tickValues = tickIndices.map(i => chartData[i]?.date);

  /**
   * Переключает видимость источника в легенде
   * @param name - Название источника
   */
  function toggleSource(name: string): void {
    setHiddenSources(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      {/* Заголовок + переключатель типа + переключатель периодов */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">Источники трафика</span>
          {totalForPeriod > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">+{totalForPeriod} за период</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ChartTypeToggle value={chartType} onChange={setChartType} />
          <div className="flex items-center gap-0.5 flex-wrap">
            {PERIOD_ORDER.map((g) => (
              <button key={g} type="button" onClick={() => setGranularity(g)}
                className={['text-xs px-1.5 py-0.5 rounded transition-colors',
                  g === granularity ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}>
                {PERIOD_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked bar chart / Area chart или пустое состояние */}
      {chartData.length < 2 ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">
          {isLoading ? '' : 'Нет данных об источниках трафика'}
        </p>
      ) : chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {visibleData.map(line => (
                <linearGradient key={`src-grad-${line.name}`} id={`src-grad-${line.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={line.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <YAxis hide domain={['auto', 'auto']} />
            <XAxis dataKey="date" ticks={tickValues}
              tickFormatter={(val: string) => fmtTick(val, granularity)}
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false} tickLine={false} />
            <Tooltip
              content={(props) => (
                <SourcesTooltip active={props.active} payload={props.payload as any} granularity={granularity} />
              )}
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
            {visibleData.map((line, idx) => (
              <Area
                key={line.name}
                type="monotone"
                dataKey={line.name}
                stroke={line.color}
                strokeWidth={idx === 0 ? 2 : 1.5}
                fill={`url(#src-grad-${line.name})`}
                dot={false}
                activeDot={{ r: 3, fill: line.color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="8%">
            <YAxis hide domain={[0, 'auto']} />
            <XAxis dataKey="date" ticks={tickValues}
              tickFormatter={(val: string) => fmtTick(val, granularity)}
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false} tickLine={false} />
            <Tooltip
              content={(props) => (
                <SourcesTooltip active={props.active} payload={props.payload as any} granularity={granularity} />
              )}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            {visibleData.map((line, idx) => (
              <Bar key={line.name} dataKey={line.name} stackId="sources" fill={line.color}
                fillOpacity={0.85} isAnimationActive={false}
                radius={idx === visibleData.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Интерактивная легенда — pill-кнопки */}
      {multiLineData.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {multiLineData.map((line) => {
            const hidden = hiddenSources.has(line.name);
            const count = line.data.reduce((s, p) => s + p.count, 0);
            return (
              <button key={line.name} type="button" onClick={() => toggleSource(line.name)}
                className={['flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-all',
                  hidden ? 'border-border/40 text-muted-foreground/50 bg-transparent' : 'border-transparent text-foreground',
                ].join(' ')}
                style={hidden ? {} : { backgroundColor: `${line.color}18`, borderColor: `${line.color}50` }}>
                {hidden
                  ? <X className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                  : <Check className="w-3 h-3 shrink-0" style={{ color: line.color }} />}
                {line.name}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
