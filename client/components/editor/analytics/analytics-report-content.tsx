/** @fileoverview Все отчёты вкладки используют единый согласованный снимок. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsCollapsibleSection } from './analytics-collapsible-section';
import { AnalyticsReportOverview, AnalyticsReportSummary } from './analytics-report-overview';
import { AnalyticsReportComparison } from './analytics-report-metrics';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsReportButtons } from './analytics-report-buttons';
import { AnalyticsReportSources } from './analytics-report-sources';
import { AnalyticsReportLeaders } from './analytics-report-leaders';
import { AnalyticsReportDistribution } from './analytics-report-distribution';
import { AnalyticsAccessCheckPanel } from './analytics-access-check-panel';
import { ChartInfoSpoiler } from './chart-info-spoiler';
import { reportTimeLabel } from './analytics-report-filter';
/**
 * Составляет отчёты общего периода; активность отдельно показывает всех взаимодействовавших и вернувшихся.
 * @param props - Согласованный снимок всех показателей.
 * @returns Разделы аналитики с общей методикой.
 */
export function AnalyticsReportContent({ snapshot }: { /** Снимок выбранной области. */ snapshot: AnalyticsV2Snapshot }) {
  const { current, composition, availability } = snapshot;
  const currentContext = `Текущий снимок: ${reportTimeLabel(snapshot.as_of, snapshot.range.timezone)} · ${snapshot.range.timezone}`;
  return <>
    <AnalyticsCollapsibleSection title="Аудитория и активность" description="Новые пользователи и реальные сообщения за один выбранный период.">
    <AnalyticsReportOverview snapshot={snapshot} />
    <section className="analytics-card analytics-report-card analytics-groups-compact analytics-active-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Активные пользователи</h3><span className="text-xl font-semibold tabular-nums">{current.audience.active_users.toLocaleString('ru-RU')}</span><AnalyticsReportComparison current={current.audience.active_users} previous={snapshot.previous?.audience.active_users} /></header>
      <AnalyticsReportChart compact expandedHeader={<p className="analytics-report-value">{current.audience.active_users.toLocaleString('ru-RU')}</p>} expandedFooter={<AnalyticsReportSummary items={[['Взаимодействовали за период', current.audience.active_users], ['Из них вернулись', current.audience.returning_users], ['Новые за период', current.audience.new_users]]} />} title="Активные пользователи" points={snapshot.points.map(point => ({ date: point.date, end_date: point.end_date, active_users: point.active_users, returning_users: point.returning_users, active_new_users: point.active_new_users }))} series={[{ key: 'active_users', label: 'Активные пользователи', color: '#22d3ee' }, { key: 'returning_users', label: 'Вернувшиеся', color: '#a78bfa' }, { key: 'active_new_users', label: 'Новые за период', color: '#3b82f6' }]} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range} allowCumulative={false} />
      <AnalyticsReportSummary items={[[ 'Взаимодействовали за период', current.audience.active_users ], [ 'Из них вернулись', current.audience.returning_users ], [ 'Новые за период', current.audience.new_users ]]} />
      <p className="text-sm text-muted-foreground">Новые и вернувшиеся входят в общее число активных пользователей. Новые впервые взаимодействовали с ботом в выбранном периоде; вернувшиеся уже взаимодействовали до его начала.</p>
      <ChartInfoSpoiler><p>Количество уникальных людей за каждый интервал. Общий итог за период считается отдельно: один человек, активный в несколько дней, не суммируется несколько раз.</p><p>Линия вернувшихся показывает людей с сохранённым взаимодействием до начала общего периода. Новые за период — активные в промежутке люди, чьё подтверждённое первое взаимодействие относится к выбранному периоду. При неполной истории дата первого сохранённого взаимодействия может отличаться от настоящей; такие данные не учитываются среди подтверждённых новых пользователей.</p></ChartInfoSpoiler>
    </section>
    </AnalyticsCollapsibleSection>
    <AnalyticsCollapsibleSection title="Источники трафика" description="Первое привлечение и повторные входы хранятся отдельно. Без метки нельзя достоверно установить площадку.">
    <AnalyticsReportSources snapshot={snapshot} />
    </AnalyticsCollapsibleSection>
    <AnalyticsCollapsibleSection title="Самые активные" description="Активность групп и рейтинги пользователей и групп за выбранный период.">
    <AnalyticsReportLeaders snapshot={snapshot} />
    </AnalyticsCollapsibleSection>
    <AnalyticsReportButtons snapshot={snapshot} />
    <AnalyticsCollapsibleSection title="Состав и доступность аудитории" description="Текущий снимок подтверждённых пользователей за всё время. Выбранный период здесь не применяется.">
    <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Доступность личных сообщений</h3></header>
      <AnalyticsReportSummary items={[[ 'Доступны для сообщений', availability.available ], [ 'Заблокировали бота', availability.blocked ], [ 'Удалённые аккаунты', availability.deleted ]]} />
      <p className="text-sm text-muted-foreground">{availability.checked_at ? `Последняя завершённая проверка: ${new Date(availability.checked_at).toLocaleString('ru-RU', { timeZone: snapshot.range.timezone })}` : 'Дата последней проверки не установлена. Статусы основаны на последних известных событиях.'}</p>
      <AnalyticsAccessCheckPanel projectId={snapshot.project_id} tokenId={snapshot.token_id} totalUsers={current.audience.total_users} showSummary={false} />
    </section>
    <div className="analytics-report-grid"><AnalyticsReportDistribution compact title="Telegram Premium" subtitle="Текущие свойства аудитории" contextLabel={currentContext} items={[{ id: 'premium', label: 'Premium', count: composition.premium }, { id: 'regular', label: 'Без Premium', count: composition.regular }, { id: 'unknown', label: 'Не определено', count: composition.unknown }]} />
      <AnalyticsReportDistribution compact title="Языки Telegram" subtitle="Язык интерфейса, указанный в профиле" contextLabel={currentContext} items={composition.languages.map(item => ({ id: item.code, label: item.code === 'unknown' ? 'Не определён' : item.code, count: item.count }))} /></div>
    </AnalyticsCollapsibleSection>
  </>;
}
