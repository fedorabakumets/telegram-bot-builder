/** @fileoverview Все отчёты вкладки используют единый согласованный снимок. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsSectionHeading } from './analytics-section-heading';
import { AnalyticsReportOverview, AnalyticsReportSummary } from './analytics-report-overview';
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
    <AnalyticsSectionHeading title="Аудитория и активность" description="Первые взаимодействия и реальные сообщения за один выбранный период." />
    <AnalyticsReportOverview snapshot={snapshot} />
    <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Взаимодействовали с ботом</h3><span className="text-xl font-semibold tabular-nums">{current.audience.active_users.toLocaleString('ru-RU')}</span></header>
      <AnalyticsReportChart points={snapshot.points.map(point => ({ ...point }))} series={[{ key: 'active_users', label: 'Все взаимодействовавшие', color: '#22d3ee' }, { key: 'returning_users', label: 'Вернувшиеся', color: '#a78bfa' }]} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range} allowCumulative={false} />
      <AnalyticsReportSummary items={[[ 'Взаимодействовали за период', current.audience.active_users ], [ 'Из них вернулись', current.audience.returning_users ]]} />
      <p className="text-sm text-muted-foreground">Вернувшиеся использовали бота до начала выбранного периода и снова взаимодействовали в нём. Они уже входят в общее число.</p>
      <ChartInfoSpoiler><p>Количество уникальных людей за каждый интервал. Общий итог за период считается отдельно: один человек, активный в несколько дней, не суммируется несколько раз.</p><p>Линия вернувшихся показывает людей с сохранённым взаимодействием до начала общего периода. Повторное действие впервые пришедшего в этом же периоде не переводит его в вернувшиеся.</p></ChartInfoSpoiler>
    </section>
    <AnalyticsSectionHeading title="Источники трафика" description="Первое привлечение и повторные входы хранятся отдельно. Без метки нельзя достоверно установить площадку." />
    <AnalyticsReportSources snapshot={snapshot} />
    <AnalyticsSectionHeading title="Самые активные" description="Рейтинг направленных сообщений и нажатий кнопок за общий период." />
    <AnalyticsReportLeaders snapshot={snapshot} />
    <AnalyticsReportButtons snapshot={snapshot} />
    <AnalyticsSectionHeading title="Состав и доступность аудитории" description="Текущий снимок подтверждённых пользователей за всё время. Выбранный период здесь не применяется." />
    <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Доступность личных сообщений</h3></header>
      <AnalyticsReportSummary items={[[ 'Доступны для сообщений', availability.available ], [ 'Заблокировали бота', availability.blocked ], [ 'Удалённые аккаунты', availability.deleted ]]} />
      <p className="text-sm text-muted-foreground">{availability.checked_at ? `Последняя завершённая проверка: ${new Date(availability.checked_at).toLocaleString('ru-RU', { timeZone: snapshot.range.timezone })}` : 'Дата последней проверки не установлена. Статусы основаны на последних известных событиях.'}</p>
      <AnalyticsAccessCheckPanel projectId={snapshot.project_id} tokenId={snapshot.token_id} totalUsers={current.audience.total_users} showSummary={false} />
    </section>
    <div className="analytics-report-grid"><AnalyticsReportDistribution title="Telegram Premium" subtitle="Текущие свойства аудитории" contextLabel={currentContext} items={[{ id: 'premium', label: 'Premium', count: composition.premium }, { id: 'regular', label: 'Без Premium', count: composition.regular }, { id: 'unknown', label: 'Не определено', count: composition.unknown }]} />
      <AnalyticsReportDistribution title="Языки Telegram" subtitle="Язык интерфейса, указанный в профиле" contextLabel={currentContext} items={composition.languages.map(item => ({ id: item.code, label: item.code === 'unknown' ? 'Не определён' : item.code, count: item.count }))} /></div>
  </>;
}
