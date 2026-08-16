/**
 * @fileoverview Карточка-график динамики источников трафика
 * @description Stacked bar / Area: топ-источники + «Остальные», обычный tooltip recharts.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, LabelList,
} from 'recharts';
import { GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';
import { fmtTick, fmtTooltipDate, getTickIndices } from '@/components/editor/database/user-database/components/stats/sparkline-utils';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import { ChartTypeToggle, ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import { GrowthGranularitySelector } from '@/components/editor/database/user-database/components/stats/growth-granularity-selector';

/**
 * Пропсы компонента AnalyticsSourcesChart
 */
export interface AnalyticsSourcesChartProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/** Сколько топ-источников на графике (+ «Остальные») */
const TOP_SOURCES = 10;

/**
 * Классический tooltip: по убыванию, «Остальные» всегда внизу
 */
function SourcesTooltip({
  active,
  payload,
  granularity,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number; payload: { date?: string } }>;
  granularity?: string;
}): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  const nonZero = payload
    .filter((e) => Number(e.value) > 0)
    .sort((a, b) => {
      const aOther = String(a.dataKey) === 'Остальные' ? 1 : 0;
      const bOther = String(b.dataKey) === 'Остальные' ? 1 : 0;
      if (aOther !== bOther) return aOther - bOther;
      return Number(b.value) - Number(a.value);
    });
  if (!nonZero.length) return null;

  return (
    <div className="bg-popover border rounded-md px-2 py-1.5 text-xs shadow-md min-w-[120px] relative z-[60]">
      <div className="opacity-60 mb-1.5 text-[10px]">{fmtTooltipDate(date, granularity)}</div>
      {nonZero.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="opacity-80 truncate">{entry.dataKey}</span>
          </div>
          <span className="font-bold tabular-nums shrink-0">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Карточка-график динамики источников трафика
 */
export function AnalyticsSourcesChart({ projectId, selectedTokenId }: AnalyticsSourcesChartProps): React.JSX.Element {
  const [granularity, setGranularity] = useState<GrowthGranularity>('1d');
  const [chartType, setChartType] = useState<ChartType>('bar');
  /** null = на графике топ-N; иначе только выбранные из легенды */
  const [selectedSources, setSelectedSources] = useState<Set<string> | null>(null);

  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;
    return liveContext.subscribe((event) => {
      if (event.type === 'new-user' && event.projectId === projectId) {
        queryClient.invalidateQueries({ queryKey: ['users-growth-by-source', projectId, selectedTokenId] });
      }
    });
  }, [liveContext, projectId, selectedTokenId, queryClient]);

  const { points, isLoading } = useGrowthBySource({ projectId, selectedTokenId, granularity });

  /** Все источники — для легенды */
  const allSourcesData = useMemo(
    () => aggregateTopSources(points, Number.POSITIVE_INFINITY),
    [points],
  );

  const allNames = useMemo(() => allSourcesData.map((d) => d.name), [allSourcesData]);

  useEffect(() => {
    if (!selectedSources?.size) return;
    const valid = new Set(allNames);
    const next = new Set([...selectedSources].filter((name) => valid.has(name)));
    if (next.size !== selectedSources.size) {
      setSelectedSources(next.size ? next : null);
    }
  }, [allNames, selectedSources]);

  const totalForPeriod = useMemo(
    () => allSourcesData.reduce((sum, line) => sum + line.data.reduce((s, p) => s + p.count, 0), 0),
    [allSourcesData],
  );

  /** Серии графика: фильтр из легенды или топ-N + «Остальные» */
  const chartSeries = useMemo(() => {
    if (selectedSources?.size) {
      const picked = allSourcesData.filter((d) => selectedSources.has(d.name));
      return picked.length ? picked : aggregateTopSources(points, TOP_SOURCES);
    }
    return aggregateTopSources(points, TOP_SOURCES);
  }, [allSourcesData, selectedSources, points]);

  /** «Остальные» внизу стека */
  const stackData = useMemo(() => {
    const others = chartSeries.find((d) => d.name === 'Остальные');
    const rest = chartSeries.filter((d) => d.name !== 'Остальные');
    return others ? [others, ...rest] : rest;
  }, [chartSeries]);

  const chartData = useMemo(() => {
    const byName = new Map(
      stackData.map((line) => [line.name, new Map(line.data.map((p) => [p.date, p.count]))]),
    );
    const allDates = new Set<string>();
    stackData.forEach((line) => line.data.forEach((p) => allDates.add(p.date)));
    return Array.from(allDates)
      .sort()
      .map((date) => {
        const point: Record<string, string | number> = { date };
        let total = 0;
        stackData.forEach((line) => {
          const value = byName.get(line.name)?.get(date) ?? 0;
          point[line.name] = value;
          total += value;
        });
        point.__total = total;
        return point;
      });
  }, [stackData]);

  const tickIndices = getTickIndices(chartData.length);
  const tickValues = tickIndices.map((i) => chartData[i]?.date);
  const filtered = Boolean(selectedSources?.size);

  function toggleSource(name: string): void {
    setSelectedSources((prev) => {
      if (!prev || !prev.size) return new Set([name]);
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        return next.size ? next : null;
      }
      next.add(name);
      if (next.size >= allNames.length) return null;
      return next;
    });
  }

  function clearSourceFilter(): void {
    setSelectedSources(null);
  }

  function renderTotalLabel(props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    index?: number;
  }): React.ReactNode {
    const index = props.index ?? 0;
    const total = Number(chartData[index]?.__total) || 0;
    if (total <= 0) return null;
    const x = Number(props.x) || 0;
    const y = Number(props.y) || 0;
    const width = Number(props.width) || 0;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={9}
        fontWeight={600}
      >
        {total}
      </text>
    );
  }

  const yAxis = (
    <YAxis
      domain={chartType === 'line' ? ['auto', 'auto'] : [0, 'auto']}
      width={36}
      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.45)' }}
      axisLine={false}
      tickLine={false}
      allowDecimals={false}
    />
  );

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">Источники трафика</span>
          {totalForPeriod > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              +{totalForPeriod} за период
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ChartTypeToggle value={chartType} onChange={setChartType} />
          <GrowthGranularitySelector value={granularity} onChange={setGranularity} />
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">
          {isLoading ? '' : 'Нет данных об источниках трафика'}
        </p>
      ) : chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {stackData.map((line) => (
                <linearGradient key={`src-grad-${line.name}`} id={`src-grad-${line.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={line.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {yAxis}
            <XAxis
              dataKey="date"
              ticks={tickValues}
              tickFormatter={(val: string) => fmtTick(val, granularity)}
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => (
                <SourcesTooltip
                  active={props.active}
                  payload={props.payload as any}
                  granularity={granularity}
                />
              )}
              wrapperStyle={{ zIndex: 70, outline: 'none' }}
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
            />
            {stackData.map((line, idx) => (
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
          <BarChart data={chartData} margin={{ top: 18, right: 4, bottom: 0, left: 0 }} barCategoryGap="8%">
            {yAxis}
            <XAxis
              dataKey="date"
              ticks={tickValues}
              tickFormatter={(val: string) => fmtTick(val, granularity)}
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => (
                <SourcesTooltip
                  active={props.active}
                  payload={props.payload as any}
                  granularity={granularity}
                />
              )}
              wrapperStyle={{ zIndex: 70, outline: 'none' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            {stackData.map((line, idx) => {
              const isTop = idx === stackData.length - 1;
              return (
                <Bar
                  key={line.name}
                  dataKey={line.name}
                  stackId="sources"
                  fill={line.color}
                  fillOpacity={0.85}
                  isAnimationActive={false}
                  radius={isTop ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                >
                  {isTop && <LabelList dataKey="__total" content={renderTotalLabel} />}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      )}

      {allSourcesData.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
          <div className="flex items-baseline justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>
              Легенда · {allSourcesData.length}
              {filtered ? ` · выбрано ${selectedSources!.size}` : ` · на графике топ-${TOP_SOURCES}`}
            </span>
            {filtered ? (
              <button
                type="button"
                onClick={clearSourceFilter}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Все
              </button>
            ) : (
              <span className="font-normal opacity-70">кликай источники — можно несколько</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-[168px] overflow-y-auto pr-1">
            {allSourcesData.map((line) => {
              const count = line.data.reduce((s, p) => s + p.count, 0);
              const active = !filtered || selectedSources!.has(line.name);
              const solo = filtered && selectedSources!.size === 1 && selectedSources!.has(line.name);
              return (
                <button
                  key={line.name}
                  type="button"
                  onClick={() => toggleSource(line.name)}
                  title={
                    active && filtered
                      ? `Убрать «${line.name}»`
                      : `Показать «${line.name}» на графике`
                  }
                  className={[
                    'grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-1.5 w-full min-w-0',
                    'px-1.5 py-1 rounded-md border text-left text-xs transition-all',
                    active
                      ? 'border-transparent bg-muted/40 text-foreground'
                      : 'border-transparent bg-transparent text-muted-foreground/50 opacity-40',
                    solo ? 'ring-1 ring-primary/40' : '',
                  ].join(' ')}
                  style={
                    active
                      ? { backgroundColor: `${line.color}18`, borderColor: `${line.color}40` }
                      : undefined
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: line.color }}
                  />
                  <code className="truncate text-[11px] font-medium">{line.name}</code>
                  <span className="tabular-nums opacity-70 text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
