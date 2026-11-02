/** @fileoverview Диаграмма распределения с ровной легендой и закреплёнными подробностями. */
import { useContext, useRef, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { X } from 'lucide-react';
import {AnalyticsChoosePeriod, AnalyticsOpenPeriodContext} from './analytics-choose-period';
import { AnalyticsChartState } from './analytics-chart-state';
import { ANALYTICS_TOOLTIP_THEME } from './analytics-tooltip-theme';
import { AnalyticsReportComparison } from './analytics-report-metrics';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AnalyticsChartActions } from './analytics-chart-actions';
/** Строка распределения. */
export interface ReportDistributionItem {
  /** Стабильный идентификатор. */ id: string;
  /** Полное название. */ label: string;
  /** Числовое значение. */ count: number;
  /** Дополнительные подписанные значения. */ details?: Array<[string, string | number]>;
  /** Значение в предыдущем периоде, если сравнение включено. */ previous?: number;
  /** История хотя бы одного периода неполна. */ approximate?: boolean;
}
/** Доступные цвета серий. */
export const REPORT_COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#fb923c', '#a3e635'];
/**
 * Показывает период или дату снимка рядом с распределением и раскрывает значения мышью и клавиатурой.
 * @param props - Данные распределения, подписи и выбранный вид.
 * @returns Диаграмма с доступной легендой и подробностями.
 */
export function AnalyticsReportDistribution({ title, items, subtitle, donut = true, contextLabel, footnote, periodSelectable=false, compact=false }: {
  /** Компактный вид карточки источников. */ compact?: boolean;
  /** Распределение зависит от общего периода, а не является текущим снимком. */ periodSelectable?:boolean;
  /** Заголовок. */ title: string;
  /** Данные текущего снимка. */ items: ReportDistributionItem[];
  /** Уточнение единицы и периода. */ subtitle?: string;
  /** Рисовать кольцо или компактные полосы. */ donut?: boolean;
  /** Точный период или момент текущего снимка. */ contextLabel?: string;
  /** Короткое пояснение методики под диаграммой. */ footnote?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const movingToPeriod = useRef(false);
  const openPeriod = useContext(AnalyticsOpenPeriodContext);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const maximum = Math.max(1, ...items.map(item => item.count));
  const chosen = items.find(item => item.id === selected);
  const content = <>
    <div className="flex flex-wrap items-center justify-between gap-2">{contextLabel && (!compact || expanded || !periodSelectable) && <p className="text-xs text-muted-foreground">{contextLabel}</p>}{periodSelectable && <AnalyticsChoosePeriod/>}</div>
    {!total && !items.some(item => item.previous !== undefined) ? <AnalyticsChartState title="Пока нет значений" description="Выберите другой период или дождитесь новых событий." /> : <div className={donut && total ? 'analytics-donut-content' : ''}>
      {donut && total > 0 && <div className="w-full min-w-0 relative"><ResponsiveContainer width="100%" height={expanded ? undefined : compact ? 150 : 224} aspect={expanded ? 1 : undefined} maxHeight={expanded ? 420 : undefined}><PieChart><Pie data={items} dataKey="count" nameKey="label" innerRadius={expanded ? '48%' : compact ? 48 : 64} outerRadius={expanded ? '92%' : compact ? 65 : 88} paddingAngle={0} isAnimationActive={false} onClick={(item: ReportDistributionItem) => setSelected(item.id)}>
        {items.map((item, index) => <Cell key={item.id} fill={REPORT_COLORS[index % REPORT_COLORS.length]} stroke="none" />)}</Pie><Tooltip {...ANALYTICS_TOOLTIP_THEME} formatter={value => Number(value).toLocaleString('ru-RU')} /></PieChart></ResponsiveContainer><span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{total.toLocaleString('ru-RU')}</span></div>}
      <div className={`analytics-donut-legend overflow-y-auto ${compact && !expanded ? "max-h-36" : "max-h-80"}`} role="list" aria-label={`${title}: точные значения`}>
        {items.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} className="w-full text-left rounded-lg hover:bg-muted/50 p-2">
          <span className="analytics-donut-row"><span style={{ color: REPORT_COLORS[index % REPORT_COLORS.length] }} aria-hidden="true">●</span><span className="min-w-0 break-words">{item.label}</span><span className="tabular-nums">{item.count.toLocaleString('ru-RU')}</span><span>{total ? `${(item.count / total * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%` : '—'}</span></span>
          {item.previous !== undefined && <span className="block pl-4"><AnalyticsReportComparison current={item.count} previous={item.previous} approximate={item.approximate} /></span>}
          {!donut && <span className="block h-2 rounded-full bg-muted mx-2"><span className="block h-full rounded-full bg-primary" style={{ width: `${item.count / maximum * 100}%` }} /></span>}
        </button>)}
      </div>
    </div>}
    {chosen && <div className="analytics-report-details space-y-2" aria-live="polite"><div className="flex justify-between gap-3"><strong className="break-words">{chosen.label}</strong><button type="button" onClick={() => setSelected(null)}>Закрыть</button></div><dl className="flex flex-wrap gap-4">{[['Количество', chosen.count], ...(chosen.details ?? [])].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</dd></div>)}</dl></div>}
    {footnote && <p className="analytics-distribution-footnote mt-auto text-xs text-muted-foreground">{footnote}</p>}</>;
  return <section className={`analytics-card analytics-report-card border rounded-2xl ${compact ? "analytics-distribution-compact" : ""} ${!donut ? "analytics-ranking-distribution" : ""}`}>
    <header><div><h3 className="text-lg font-semibold">{title}</h3>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div></header>
    <AnalyticsChartActions title={title} open={() => setExpanded(true)} triggerRef={expandRef} />
    {!expanded && content}<Dialog open={expanded} onOpenChange={setExpanded}><DialogContent hideClose aria-describedby={undefined}
      onCloseAutoFocus={event => { if (movingToPeriod.current) { movingToPeriod.current = false; return; } event.preventDefault(); expandRef.current?.focus(); }} className="w-[calc(100%-1rem)] max-w-none sm:max-w-[min(1100px,96vw)] max-h-[94dvh] overflow-y-auto">
      <div className="analytics-distribution-dialog-header flex min-w-0 items-center justify-between gap-3"><DialogTitle className="min-w-0 flex-1 text-left text-base font-semibold leading-6">{title}</DialogTitle><div className="flex shrink-0 items-center gap-2">
        <AnalyticsChartActions expanded open={() => setExpanded(true)} triggerRef={expandRef} />
        <button type="button" onClick={() => setExpanded(false)} aria-label="Закрыть график" title="Закрыть график" className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" aria-hidden="true" /></button></div></div>
      <AnalyticsOpenPeriodContext.Provider value={openPeriod ? () => { movingToPeriod.current = true; setExpanded(false); openPeriod(); } : null}>{content}</AnalyticsOpenPeriodContext.Provider></DialogContent></Dialog>
  </section>;
}
