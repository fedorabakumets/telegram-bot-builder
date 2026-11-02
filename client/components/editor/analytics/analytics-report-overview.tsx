/** @fileoverview Согласованные главные карточки новых пользователей и реальных сообщений. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsArrivalCard } from './analytics-arrival-card';
import { AnalyticsMessageCard } from './analytics-message-card';
export { AnalyticsReportSummary } from './analytics-report-metrics';
/**
 * Рисует главные графики из одного снимка; карточка сообщений содержит только входящие и ответы.
 * @param props - Снимок текущей области.
 * @returns Карточки аудитории и сообщений.
 */
export function AnalyticsReportOverview({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  return <div className="analytics-report-grid analytics-overview-report-grid">
    <AnalyticsArrivalCard snapshot={snapshot} />
    <AnalyticsMessageCard snapshot={snapshot} />
  </div>;
}
