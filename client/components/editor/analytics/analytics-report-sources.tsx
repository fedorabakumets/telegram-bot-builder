/** @fileoverview Согласованные динамика и плотное распределение источников общего периода. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsReportChart, type ReportChartPoint } from './analytics-report-chart';
import { AnalyticsReportDistribution, REPORT_COLORS } from './analytics-report-distribution';
import { reportRangeLabel } from './analytics-report-filter';
import { AnalyticsReportComparison } from './analytics-report-metrics';
/**
 * Группирует источники, сохраняя общие даты и календарные окончания интервалов у всех рядов.
 * @param props - Снимок источников общего периода.
 * @returns Динамика источников и распределение.
 */
export function AnalyticsReportSources({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const top = [...snapshot.sources].sort((a, b) => (b.new_users + (b.restored_users ?? 0)) - (a.new_users + (a.restored_users ?? 0))).slice(0, 8);
  const previous = snapshot.previous && snapshot.previous_sources ? snapshot.previous_sources : null;
  const approximate = snapshot.current.audience.first_history_status !== 'complete' || snapshot.previous?.audience.first_history_status !== 'complete';
  const count = (item: typeof snapshot.sources[number]) => item.new_users + (item.restored_users ?? 0);
  const currentTotal = snapshot.sources.reduce((sum, item) => sum + count(item), 0);
  const previousTotal = previous?.reduce((sum, item) => sum + count(item), 0);
  const sources = new Map(snapshot.sources.map(item => [item.id, item]));
  for (const item of previous ?? []) if (!sources.has(item.id)) sources.set(item.id, { ...item, new_users: 0, restored_users: 0, returning_users: 0, starts: 0 });
  const previousById = new Map((previous ?? []).map(item => [item.id, item]));
  const empty = Object.fromEntries(top.map(item => [item.id, 0]));
  const byDate = new Map<string, ReportChartPoint>(snapshot.points.map(point => [point.date, { date: point.date, end_date: point.end_date, ...empty }]));
  for (const point of snapshot.source_points) {
    const row = byDate.get(point.date) ?? { date: point.date, ...empty };
    row[point.id] = Number(row[point.id] ?? 0) + point.new_users + (point.restored_users ?? 0);
    byDate.set(point.date, row);
  }
  return <div className="analytics-report-grid analytics-sources-compact">
    <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Динамика источников</h3>{previous && <AnalyticsReportComparison current={currentTotal} previous={previousTotal} approximate={approximate} />}</header>
      <AnalyticsReportChart compact height={360} title="Динамика источников" points={[...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))} series={top.map((item, index) => ({ key: item.id, label: item.label, color: REPORT_COLORS[index] }))} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range}
        emptyTitle="Нет первых взаимодействий за выбранный период"
        emptyDescription="В выбранном периоде первых сохранённых взаимодействий нет. Повторные обращения учитываются в активности." />
      {snapshot.sources.length > top.length && <p className="text-sm text-muted-foreground">На графике {top.length} крупнейших источников. Полное распределение доступно рядом.</p>}
    </section>
    <AnalyticsReportDistribution compact periodSelectable title="Распределение по источникам" contextLabel={reportRangeLabel(snapshot.range)} items={[...sources.values()].map(item => ({ id: item.id, label: item.label, count: count(item),
      previous: previous ? (previousById.has(item.id) ? count(previousById.get(item.id)!) : 0) : undefined, approximate,
      details: [...(previous ? [['В предыдущем периоде', previousById.has(item.id) ? count(previousById.get(item.id)!) : 0] as [string, number]] : []), ['Вернулись по ссылке', item.returning_users], ['Запуски по ссылке', item.starts]] }))} />
  </div>;
}
