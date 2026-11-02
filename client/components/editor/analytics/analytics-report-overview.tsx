/** @fileoverview Согласованные главные карточки новых пользователей и реальных сообщений. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsReportChart, type ReportChartPoint } from './analytics-report-chart';
import { ChartInfoSpoiler } from './chart-info-spoiler';
import { AnalyticsArrivalCard } from './analytics-arrival-card';
import { AnalyticsReportComparison, AnalyticsReportSummary } from './analytics-report-metrics';
export { AnalyticsReportSummary } from './analytics-report-metrics';
/**
 * Рисует главные графики из одного снимка; карточка сообщений содержит только входящие и ответы.
 * @param props - Снимок текущей области.
 * @returns Карточки аудитории и сообщений.
 */
export function AnalyticsReportOverview({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const { current, previous, range } = snapshot;
  const points: ReportChartPoint[] = snapshot.points.map(point => ({ ...point }));
  return <div className="analytics-report-grid">
    <AnalyticsArrivalCard snapshot={snapshot} />
    <section className="analytics-card analytics-report-card border rounded-2xl">
      <header><h3 className="text-lg font-semibold">Сообщения</h3><AnalyticsReportComparison current={current.messages.total} previous={previous?.messages.total} /></header>
      <div><p className="analytics-report-value">{current.messages.total.toLocaleString('ru-RU')}</p><p className="text-sm text-muted-foreground">входящие сообщения и ответы бота за период</p></div>
      <AnalyticsReportChart points={points} series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }, { key: 'outgoing', label: 'Ответы бота', color: '#a78bfa' }]} timezone={range.timezone} stepMs={range.step_ms} range={range} />
      <AnalyticsReportSummary items={[[ 'Входящие', current.messages.incoming ], [ 'Ответы бота', current.messages.outgoing ]]} />
      <ChartInfoSpoiler><p>Сумма включает реальные сообщения людей и успешные отправки бота. Нажатия кнопок доступны в разделе «Популярные действия».</p><p>Служебных событий за период: {current.messages.system.toLocaleString('ru-RU')}. Изменения доступности и статуса чатов не увеличивают сообщения.</p></ChartInfoSpoiler>
    </section>
  </div>;
}
