/** @fileoverview Согласованные динамика и распределение источников общего периода. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsReportChart, type ReportChartPoint } from './analytics-report-chart';
import { AnalyticsReportDistribution, REPORT_COLORS } from './analytics-report-distribution';
import { reportRangeLabel } from './analytics-report-filter';
/**
 * Группирует источники, сохраняя общие даты и календарные окончания интервалов у всех рядов.
 * @param props - Снимок источников общего периода.
 * @returns Динамика первых взаимодействий и распределение.
 */
export function AnalyticsReportSources({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const top = [...snapshot.sources].sort((a, b) => (b.new_users + (b.restored_users ?? 0)) - (a.new_users + (a.restored_users ?? 0))).slice(0, 8);
  const empty = Object.fromEntries(top.map(item => [item.id, 0]));
  const byDate = new Map<string, ReportChartPoint>(snapshot.points.map(point => [point.date, { date: point.date, end_date: point.end_date, ...empty }]));
  for (const point of snapshot.source_points) {
    const row = byDate.get(point.date) ?? { date: point.date, ...empty };
    row[point.id] = Number(row[point.id] ?? 0) + point.new_users + (point.restored_users ?? 0);
    byDate.set(point.date, row);
  }
  return <div className="analytics-report-grid">
    <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Динамика первых взаимодействий</h3></header><p className="text-sm text-muted-foreground">Источники первых сохранённых взаимодействий</p>
      <AnalyticsReportChart points={[...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))} series={top.map((item, index) => ({ key: item.id, label: item.label, color: REPORT_COLORS[index] }))} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range}
        emptyTitle="Нет первых взаимодействий за выбранный период"
        emptyDescription="В выбранном периоде первых сохранённых взаимодействий нет. Повторные обращения учитываются в активности." />
      {snapshot.sources.length > top.length && <p className="text-sm text-muted-foreground">На графике {top.length} крупнейших источников. Полное распределение доступно рядом.</p>}
    </section>
    <AnalyticsReportDistribution title="Распределение по источникам" subtitle="Первые сохранённые взаимодействия за выбранный период" contextLabel={reportRangeLabel(snapshot.range)} items={snapshot.sources.map(item => ({ id: item.id, label: item.label, count: item.new_users + (item.restored_users ?? 0), details: [['Вернулись по ссылке', item.returning_users], ['Запуски по ссылке', item.starts]] }))} />
  </div>;
}
