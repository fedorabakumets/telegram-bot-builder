/** @fileoverview Популярные кнопки по нажатиям либо людям с раздельным происхождением старых и новых данных. */
import { useState } from 'react';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsSectionHeading } from './analytics-section-heading';
import { AnalyticsReportDistribution } from './analytics-report-distribution';
import { reportRangeLabel } from './analytics-report-filter';
/**
 * Считает проверенную старую запись одним нажатием, сохраняя отдельные составляющие в подробностях.
 * @param props - Согласованный снимок общего периода.
 * @returns Переключатель показателя и рейтинг кнопок.
 */
export function AnalyticsReportButtons({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const [people, setPeople] = useState(false);
  const items = snapshot.buttons.map(item => ({ id: item.label, label: item.label,
    count: people ? item.people ?? item.count : item.count + (item.historical_count ?? 0),
    details: [['С Telegram ID', item.count], ['Из старой истории', item.historical_count ?? 0], ['Уникальные люди', item.people ?? item.count]] as Array<[string, number]>,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 20);
  return <div className="space-y-4">
    <AnalyticsSectionHeading title="Популярные действия" description="Нажатия кнопок за выбранный период, включая проверенную старую историю." />
    <div className="analytics-segments w-fit" role="group" aria-label="Показатель популярности кнопок">
      <button type="button" aria-pressed={!people} onClick={() => setPeople(false)}>Нажатия</button>
      <button type="button" aria-pressed={people} onClick={() => setPeople(true)}>Люди</button>
    </div>
    <AnalyticsReportDistribution key={people ? 'people' : 'clicks'} title={people ? 'Кнопки по числу людей' : 'Нажатия кнопок'} donut={false}
      contextLabel={reportRangeLabel(snapshot.range)} items={items} />
  </div>;
}
