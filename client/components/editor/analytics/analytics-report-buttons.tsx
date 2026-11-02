/** @fileoverview Две соседние карточки популярных кнопок по нажатиям и людям с раздельным происхождением старых и новых данных. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsCollapsibleSection } from './analytics-collapsible-section';
import { AnalyticsReportDistribution } from './analytics-report-distribution';
import { reportRangeLabel } from './analytics-report-filter';
/**
 * Считает проверенную старую запись одним нажатием, сохраняя отдельные составляющие в подробностях.
 * @param props - Согласованный снимок общего периода.
 * @returns Два рейтинга кнопок с общим периодом.
 */
export function AnalyticsReportButtons({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  /** Формирует независимый рейтинг выбранного показателя. @param people - Считать людей вместо нажатий. @returns Десять лидирующих кнопок. */
  const ranking = (people: boolean) => snapshot.buttons.map(item => ({ id: item.label, label: item.label,
    count: people ? item.people ?? item.count : item.count + (item.historical_count ?? 0),
    details: [['С Telegram ID', item.count], ['Из старой истории', item.historical_count ?? 0], ['Уникальные люди', item.people ?? item.count]] as Array<[string, number]>,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 10);
  return <AnalyticsCollapsibleSection title="Популярные действия">
    <div className="analytics-report-grid analytics-overview-report-grid analytics-popular-actions-grid">
      <AnalyticsReportDistribution compact periodSelectable title="Нажатия кнопок" donut={false}
        contextLabel={reportRangeLabel(snapshot.range)} items={ranking(false)} />
      <AnalyticsReportDistribution compact periodSelectable title="Кнопки по числу людей" donut={false}
        contextLabel={reportRangeLabel(snapshot.range)} items={ranking(true)} />
    </div>
  </AnalyticsCollapsibleSection>;
}
