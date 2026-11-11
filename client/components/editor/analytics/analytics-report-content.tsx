/** @fileoverview Все отчёты вкладки используют единый согласованный снимок. */
import { AnalyticsHeadingHint } from './analytics-heading-hint';
import { AnalyticsChoosePeriod } from './analytics-choose-period';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsCollapsibleSection } from './analytics-collapsible-section';
import { AnalyticsReportOverview, AnalyticsReportSummary } from './analytics-report-overview';
import { AnalyticsReportComparison } from './analytics-report-metrics';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsReportButtons } from './analytics-report-buttons';
import { AnalyticsReportSources } from './analytics-report-sources';
import { AnalyticsReportLeaders, AnalyticsUserLeaders } from './analytics-report-leaders';
import { AnalyticsReportDistribution } from './analytics-report-distribution';
import { AnalyticsAccessCheckPanel } from './analytics-access-check-panel';
/**
 * Составляет отчёты общего периода; активность отдельно показывает всех взаимодействовавших и вернувшихся.
 * @param props - Согласованный снимок всех показателей.
 * @returns Разделы аналитики с общей методикой.
 */
export function AnalyticsReportContent({ snapshot }: { /** Снимок выбранной области. */ snapshot: AnalyticsV2Snapshot }) {
  const { current, composition, availability } = snapshot;
  return <>
    <AnalyticsCollapsibleSection title="Аудитория и активность">
    <AnalyticsReportOverview snapshot={snapshot} />
    {/* График и десятка лидеров делят широкую строку поровну. */}
    <div className="analytics-report-grid analytics-overview-report-grid analytics-active-leaders-grid">
    <section className="analytics-card analytics-report-card analytics-groups-compact analytics-active-card border rounded-2xl"><header><h3 className="text-lg font-semibold"><AnalyticsHeadingHint label="Активные пользователи" /></h3><span className="text-xl font-semibold tabular-nums">{current.audience.active_users.toLocaleString('ru-RU')}</span><AnalyticsReportComparison current={current.audience.active_users} previous={snapshot.previous?.audience.active_users} /><AnalyticsChoosePeriod/></header>
      <AnalyticsReportChart compact height={280} expandedHeader={<p className="analytics-report-value">{current.audience.active_users.toLocaleString('ru-RU')}</p>} expandedFooter={<AnalyticsReportSummary items={[['Взаимодействовали за период', current.audience.active_users], ['Из них вернулись', current.audience.returning_users], ['Новые за период', current.audience.new_users]]} />} title="Активные пользователи" points={snapshot.points.map(point => ({ date: point.date, end_date: point.end_date, active_users: point.active_users, returning_users: point.returning_users, active_new_users: point.active_new_users }))} series={[{ key: 'active_users', label: 'Активные пользователи', color: '#22d3ee' }, { key: 'returning_users', label: 'Вернувшиеся', color: '#a78bfa' }, { key: 'active_new_users', label: 'Новые за период', color: '#3b82f6' }]} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range} allowCumulative={false} />
      <AnalyticsReportSummary items={[[ 'Взаимодействовали за период', current.audience.active_users ], [ 'Из них вернулись', current.audience.returning_users ], [ 'Новые за период', current.audience.new_users ]]} />
    </section>
    <AnalyticsUserLeaders snapshot={snapshot} />
    </div>
    </AnalyticsCollapsibleSection>
    <AnalyticsCollapsibleSection title="Источники трафика" description="Без метки площадка неизвестна">
    <AnalyticsReportSources snapshot={snapshot} />
    </AnalyticsCollapsibleSection>
    <AnalyticsCollapsibleSection title="Самые активные">
    <AnalyticsReportLeaders snapshot={snapshot} />
    </AnalyticsCollapsibleSection>
    <AnalyticsReportButtons snapshot={snapshot} />
    <AnalyticsCollapsibleSection title="Состав и доступность аудитории" description="За всё время">
    <section className="analytics-card analytics-report-card analytics-availability-card border rounded-2xl"><header><h3 className="text-lg font-semibold"><AnalyticsHeadingHint label="Доступность личных сообщений" /></h3></header>
      <AnalyticsReportSummary items={[[ 'Доступны для сообщений', availability.available ], [ 'Заблокировали бота', availability.blocked ], [ 'Удалённые аккаунты', availability.deleted ]]} />
      <p className="text-sm text-muted-foreground">{availability.checked_at ? `Проверено: ${new Date(availability.checked_at).toLocaleString('ru-RU', { timeZone: snapshot.range.timezone })}` : 'Дата проверки неизвестна · последние известные статусы'}</p>
      <AnalyticsAccessCheckPanel projectId={snapshot.project_id} tokenId={snapshot.token_id} totalUsers={current.audience.total_users} showSummary={false} />
    </section>
    {/* Сетка распределений сохраняет две колонки в рабочей панели. */}
    <div className="analytics-report-grid analytics-audience-distribution-grid"><AnalyticsReportDistribution compact title="Telegram Premium" items={[{ id: 'premium', label: 'Premium', count: composition.premium }, { id: 'regular', label: 'Без Premium', count: composition.regular }, { id: 'unknown', label: 'Не определено', count: composition.unknown }]} />
      <AnalyticsReportDistribution compact title="Языки Telegram" items={composition.languages.map(item => ({ id: item.code, label: item.code === 'unknown' ? 'Не определён' : item.code, count: item.count }))} /></div>
    </AnalyticsCollapsibleSection>
  </>;
}
