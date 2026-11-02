/** @fileoverview Временной график с закреплением точки и доступным списком точных значений. */
import type { ReactNode } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import {AnalyticsChartRangeContext} from './analytics-chart-range-selection';
import {AnalyticsChoosePeriod, AnalyticsOpenPeriodContext} from './analytics-choose-period';
import { AnalyticsChartState } from './analytics-chart-state';
import { AnalyticsReportPeriod } from './analytics-report-period';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AnalyticsChartActions } from './analytics-chart-actions';
import { AnalyticsCompactTooltip } from './analytics-compact-tooltip';
/** Ряд с подписью и цветом. */
export interface ReportSeries {
  /** Ключ числового значения. */ key: string;
  /** Название единицы. */ label: string;
  /** Цвет графика. */ color: string;
}
/** Временная точка нескольких рядов. */
export interface ReportChartPoint {
  /** Начало интервала. */ date: string;
  /** Фактический конец календарного интервала; старый снимок может не содержать его. */ end_date?: string;
  /** Значения рядов и необязательные календарные границы. */ [key: string]: string | number | undefined;
}
/** Параметры временного графика. */
interface Props {
  /** Название карточки графика. */ title?: string;
  /** Компактная высота в обзорной карточке. */ compact?: boolean;
  /** Основной показатель для развёрнутого вида. */ expandedHeader?: ReactNode;
  /** Сводка и пояснение для развёрнутого вида. */ expandedFooter?: ReactNode;
  /** Временные точки. */ points: ReportChartPoint[];
  /** Состав рядов. */ series: ReportSeries[];
  /** Пояс представления. */ timezone: string;
  /** Шаг точек. */ stepMs: number;
  /** Разрешить нарастающий итог. */ allowCumulative?: boolean;
  /** Границы отчёта для неполных крайних интервалов. */ range?: { /** Начало. */ from: string; /** Конец. */ to: string };
  /** Уточняет смысл пустого ряда для конкретного показателя. */ emptyTitle?: string;
  /** Объясняет отсутствие подтверждённых значений или ограничение истории. */ emptyDescription?: string;
}
/**
 * Показывает период возле графика и предоставляет те же значения доступными кнопками.
 * @param props - Ряды, временной диапазон и доступные режимы.
 * @returns График с закрепляемыми подробностями и списком значений.
 */
export function AnalyticsReportChart({ title, compact = false, expandedHeader, expandedFooter, points, series, timezone, stepMs, allowCumulative = true, range, emptyTitle, emptyDescription }: Props) {
  const [type, setType] = useState('line');
  const [cumulative, setCumulative] = useState(false);
  const applyRange=useContext(AnalyticsChartRangeContext);
  const openPeriod = useContext(AnalyticsOpenPeriodContext);
  const [hovered,setHovered]=useState<string|null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const movingToPeriod = useRef(false);
  /** Области, внутри которых закреплённый промежуток не закрывается. */
  const chartRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected) return;
    /** Закрывает подробности при нажатии за пределами графика и карточки. */
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest('[data-analytics-chart-control]')) return;
      if (event.target instanceof Node && (chartRef.current?.contains(event.target) || detailsRef.current?.contains(event.target))) return;
      setSelected(null); setHovered(null);
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [selected]);
  const rows = useMemo(() => {
    const totals: Record<string, number> = {};
    return points.map(point => {
      const row = { ...point };
      for (const item of series) { totals[item.key] = (totals[item.key] ?? 0) + Number(point[item.key] ?? 0); if (cumulative && allowCumulative) row[item.key] = totals[item.key]; }
      return row;
    });
  }, [points, series, cumulative, allowCumulative]);
  const formatDate = (date: string, full = false) => new Date(date).toLocaleString('ru-RU', { timeZone: timezone, day: 'numeric', month: 'short', ...(full ? { year: 'numeric' as const } : {}), ...(stepMs < 86400000 ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}) });
  const chosen = rows.find(point => point.date === (selected ?? hovered));
  /** Закреплённая точка видна независимо от положения указателя. */
  const pinned = selected ? rows.find(point => point.date === selected) : undefined;
  /** Подписывает фактические календарные границы, включая сутки длиной 23/25 часов и обрезанные края. */
  const intervalBounds = (date: string) => {
    const intervalStart = cumulative && allowCumulative ? points[0]?.date ?? date : date;
    const start = Math.max(Date.parse(intervalStart), range ? Date.parse(range.from) : -Infinity);
    const calendarEnd = rows.find(point => point.date === date)?.end_date;
    const end = Math.min(calendarEnd ? Date.parse(calendarEnd) : Date.parse(date) + stepMs, range ? Date.parse(range.to) : Infinity);
    return {from:new Date(start).toISOString(),to:new Date(end).toISOString()};
  };
  /** Подписывает те же границы, которые применяются к общему фильтру. */
  const formatInterval = (date:string) => {
    if(!Number.isFinite(Date.parse(date)))return '';
    const bounds=intervalBounds(date);
    const format = (value: string) => {
      const formatted = new Date(value).toLocaleString('ru-RU', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return formatted.charAt(0).toLocaleUpperCase('ru-RU') + formatted.slice(1);
    };
    return `${format(bounds.from)} — ${format(bounds.to)} · ${timezone}`;
  };
  /** Полные сутки подписывает русской датой, неполные интервалы — точными границами. */
  const formatTooltipInterval = (date: string) => {
    const bounds = intervalBounds(date);
    if (stepMs === 86400000 && !cumulative) {
      const weekday = new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(bounds.from));
      return weekday.charAt(0).toLocaleUpperCase('ru-RU') + weekday.slice(1);
    }
    const parts = (value: string) => new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value));
    const startDay = new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const lastDay = new Date(Date.parse(bounds.to) - 1);
    if (parts(bounds.from) === '00:00:00' && parts(bounds.to) === '00:00:00' && startDay.format(new Date(bounds.from)) === startDay.format(lastDay)) {
      const value = new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(bounds.from));
      return value.charAt(0).toLocaleUpperCase('ru-RU') + value.slice(1);
    }
    return formatInterval(date);
  };
  /**
   * Закрепляет выбранный интервал; неизвестные события графика игнорируются.
   * @param event - Событие выбора графика.
   * @param pin - Закрепить интервал либо показать временный предпросмотр.
   * @returns Ничего; изменяет выбранную точку.
   */
  function selectPoint(event: unknown, pin=true) {
    const candidate = event as { isTooltipActive?:boolean; activeLabel?: string; activePayload?: { payload?: ReportChartPoint }[] } | null;
    const date = candidate?.activePayload?.[0]?.payload?.date ?? candidate?.activeLabel;
    if (pin) {if(date && rows.some(row=>row.date===date))setSelected(date);}
    else setHovered(candidate?.isTooltipActive!==false && date && rows.some(row=>row.date===date) ? date : null);
  }
  const hasValues = rows.some(row => series.some(item => Number(row[item.key]) > 0));
  const chart = <figure className="min-w-0 space-y-3">
    {(!compact || expanded) && <div className="flex flex-wrap items-center justify-between gap-2"><AnalyticsReportPeriod range={range} timezone={timezone} /><AnalyticsChoosePeriod /></div>}
    <div className="analytics-chart-view-controls flex flex-wrap items-center gap-3 text-sm"><label className="flex items-center gap-2">Вид<select aria-label="Вид графика" className="analytics-native-field" value={type} onChange={event => setType(event.target.value)}><option value="line">Линия</option><option value="bar">Столбцы</option></select></label>
      {allowCumulative && <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={cumulative} onChange={event => setCumulative(event.target.checked)} /><span className="analytics-label-full">Накопительно внутри периода</span><span className="analytics-label-short" aria-label="Накопительно внутри периода">Накоп.</span></label>}{compact && !expanded && <AnalyticsChoosePeriod />}</div>
    <div ref={chartRef} className="analytics-chart-plot min-w-0 overflow-x-auto"><div style={hasValues && type === 'bar' ? { minWidth: rows.length * series.length * 9 + 72 } : undefined}>{!hasValues ? <AnalyticsChartState title={emptyTitle ?? 'В выбранном периоде нет событий'} description={emptyDescription ?? 'Данные появятся после взаимодействий с ботом. Можно выбрать другой период.'} /> : <ResponsiveContainer width="100%" height={expanded ? 420 : compact ? 160 : 224}>
      <ComposedChart data={rows} barGap={0} barCategoryGap="10%" margin={{ top: 8, right: 8, left: 0, bottom: 8 }} onClick={event=>selectPoint(event)} onMouseMove={event=>selectPoint(event,false)} onMouseLeave={()=>setHovered(null)} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={value => formatDate(String(value))} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={42} tickFormatter={value => Number(value).toLocaleString('ru-RU')} />
        {/** В развёрнутом режиме подсказка следует за точкой; в обычном остаётся под графиком. */}
        <Tooltip content={expanded && !selected ? <AnalyticsCompactTooltip formatInterval={formatTooltipInterval} /> : () => null} cursor={selected ? false : {stroke:'var(--border)'}} wrapperStyle={{ pointerEvents: 'none', maxWidth: 'calc(100% - 16px)' }} />
        {series.map(item => type === 'bar' ? <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} /> : <Area key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} fill={item.color} fillOpacity={0.08} strokeWidth={2} isAnimationActive={false} />)}
        {pinned && <ReferenceLine x={pinned.date} stroke="var(--muted-foreground)" strokeDasharray="4 4" />}
        {pinned && series.map(item => <ReferenceDot key={item.key} x={pinned.date} y={Number(pinned[item.key] ?? 0)} r={5} fill={item.color} stroke="var(--background)" strokeWidth={2} />)}
      </ComposedChart>
    </ResponsiveContainer>}</div></div>
    <div data-analytics-chart-preview className="relative z-10" aria-hidden="true" hidden={!chosen || !!selected || expanded}>{chosen && !selected && !expanded && <div className="pointer-events-none"><AnalyticsCompactTooltip active label={chosen.date} payload={series.map(item => ({ name: item.label, color: item.color, value: Number(chosen[item.key] ?? 0) }))} formatInterval={formatTooltipInterval} /></div>}</div>
    <figcaption className="analytics-chart-legend flex flex-wrap gap-4 text-xs text-muted-foreground">{series.map(item => <span key={item.key}><span aria-hidden="true" style={{ color: item.color }}>● </span>{item.label}</span>)}</figcaption>
    {chosen && selected && <div ref={detailsRef} className="analytics-report-details space-y-2" aria-live="polite"><p className="text-xs text-muted-foreground">{cumulative && allowCumulative ? 'Накопительно за этот промежуток' : 'За этот промежуток'}</p><div className="analytics-interval-heading"><strong>{formatInterval(chosen.date)}</strong><button type="button" className="text-muted-foreground" onClick={() => {setSelected(null);setHovered(null);}}>Закрыть</button></div>
      {selected && applyRange && <button type="button" className="rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" onClick={()=>{applyRange(intervalBounds(chosen.date));setSelected(null);setHovered(null);}}>Выбрать этот период</button>}
      <dl className="flex flex-wrap gap-4">{series.map(item => <div key={item.key}><dt className="text-muted-foreground"><span aria-hidden="true" style={{color:item.color}}>● </span>{item.label}{cumulative ? ' · накопительно' : ''}</dt><dd className="font-semibold tabular-nums">{Number(chosen[item.key] ?? 0).toLocaleString('ru-RU')}</dd></div>)}</dl></div>}
    {rows.length > 0 && <details><summary className="text-sm text-muted-foreground cursor-pointer py-2">Все значения графика</summary><div className="analytics-chart-value-list" role="list">{rows.map(row => <button key={row.date} type="button" aria-pressed={selected === row.date} onClick={() => setSelected(row.date)}><span>{formatInterval(row.date)}</span><span>{series.map(item => `${item.label}: ${Number(row[item.key] ?? 0).toLocaleString('ru-RU')}`).join(' · ')}</span></button>)}</div></details>}
  </figure>;
  return <div className="min-w-0 space-y-2"><AnalyticsChartActions title={title} open={() => setExpanded(true)} triggerRef={expandRef} />
    {!expanded && chart}<Dialog open={expanded} onOpenChange={setExpanded}><DialogContent hideClose aria-describedby={undefined}
      onCloseAutoFocus={event => { if (movingToPeriod.current) { movingToPeriod.current = false; return; } event.preventDefault(); expandRef.current?.focus(); }} className="w-[calc(100%-1rem)] max-w-none sm:max-w-[min(1100px,96vw)] max-h-[94dvh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3" data-analytics-chart-control><DialogTitle>{title ?? 'График аналитики'}</DialogTitle><div className="flex items-center gap-2">
        <AnalyticsChartActions expanded open={() => setExpanded(true)} triggerRef={expandRef} />
        <button type="button" onClick={() => setExpanded(false)} className="rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring">Закрыть график</button></div></div>
      {expandedHeader}<AnalyticsOpenPeriodContext.Provider value={openPeriod ? () => { movingToPeriod.current = true; setExpanded(false); openPeriod(); } : null}>{chart}</AnalyticsOpenPeriodContext.Provider>{expandedFooter}</DialogContent></Dialog></div>;
}
