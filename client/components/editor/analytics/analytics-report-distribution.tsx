/** @fileoverview Диаграмма распределения с ровной легендой и закреплёнными подробностями. */
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {AnalyticsChoosePeriod} from './analytics-choose-period';
import { AnalyticsChartState } from './analytics-chart-state';
import { ANALYTICS_TOOLTIP_THEME } from './analytics-tooltip-theme';
/** Строка распределения. */
export interface ReportDistributionItem {
  /** Стабильный идентификатор. */ id: string;
  /** Полное название. */ label: string;
  /** Числовое значение. */ count: number;
  /** Дополнительные подписанные значения. */ details?: Array<[string, string | number]>;
}
/** Доступные цвета серий. */
export const REPORT_COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#fb923c', '#a3e635'];
/**
 * Показывает период или дату снимка рядом с распределением и раскрывает значения мышью и клавиатурой.
 * @param props - Данные распределения, подписи и выбранный вид.
 * @returns Диаграмма с доступной легендой и подробностями.
 */
export function AnalyticsReportDistribution({ title, items, subtitle, donut = true, contextLabel, footnote, periodSelectable=false }: {
  /** Распределение зависит от общего периода, а не является текущим снимком. */ periodSelectable?:boolean;
  /** Заголовок. */ title: string;
  /** Данные текущего снимка. */ items: ReportDistributionItem[];
  /** Уточнение единицы и периода. */ subtitle?: string;
  /** Рисовать кольцо или компактные полосы. */ donut?: boolean;
  /** Точный период или момент текущего снимка. */ contextLabel?: string;
  /** Короткое пояснение методики под диаграммой. */ footnote?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const maximum = Math.max(1, ...items.map(item => item.count));
  const chosen = items.find(item => item.id === selected);
  return <section className="analytics-card analytics-report-card border rounded-2xl">
    <header><div><h3 className="text-lg font-semibold">{title}</h3>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div></header>
    <div className="flex flex-wrap items-center justify-between gap-2">{contextLabel && <p className="text-xs text-muted-foreground">{contextLabel}</p>}{periodSelectable && <AnalyticsChoosePeriod/>}</div>
    {!total ? <AnalyticsChartState title="Пока нет значений" description="Выберите другой период или дождитесь новых событий." /> : <div className={donut ? 'analytics-donut-content' : ''}>
      {donut && <div className="w-full min-w-0 relative"><ResponsiveContainer width="100%" height={224}><PieChart><Pie data={items} dataKey="count" nameKey="label" innerRadius={64} outerRadius={88} paddingAngle={0} isAnimationActive={false} onClick={(item: ReportDistributionItem) => setSelected(item.id)}>
        {items.map((item, index) => <Cell key={item.id} fill={REPORT_COLORS[index % REPORT_COLORS.length]} stroke="none" />)}</Pie><Tooltip {...ANALYTICS_TOOLTIP_THEME} formatter={value => Number(value).toLocaleString('ru-RU')} /></PieChart></ResponsiveContainer><span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{total.toLocaleString('ru-RU')}</span></div>}
      <div className="analytics-donut-legend max-h-80 overflow-y-auto" role="list" aria-label={`${title}: точные значения`}>
        {items.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} className="w-full text-left rounded-lg hover:bg-muted/50 p-2">
          <span className="analytics-donut-row"><span style={{ color: REPORT_COLORS[index % REPORT_COLORS.length] }} aria-hidden="true">●</span><span className="min-w-0 break-words">{item.label}</span><span className="tabular-nums">{item.count.toLocaleString('ru-RU')}</span><span>{(item.count / total * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%</span></span>
          {!donut && <span className="block h-2 rounded-full bg-muted mx-2"><span className="block h-full rounded-full bg-primary" style={{ width: `${item.count / maximum * 100}%` }} /></span>}
        </button>)}
      </div>
    </div>}
    {chosen && <div className="analytics-report-details space-y-2" aria-live="polite"><div className="flex justify-between gap-3"><strong className="break-words">{chosen.label}</strong><button type="button" onClick={() => setSelected(null)}>Закрыть</button></div><dl className="flex flex-wrap gap-4">{[['Количество', chosen.count], ...(chosen.details ?? [])].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</dd></div>)}</dl></div>}
    {footnote && <p className="mt-auto text-xs text-muted-foreground">{footnote}</p>}
  </section>;
}
