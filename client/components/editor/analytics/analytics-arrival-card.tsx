/** @fileoverview Единый график первых взаимодействий без временного оформления исторических данных. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsReportComparison, AnalyticsReportSummary } from './analytics-report-metrics';
/** Объединяет первые сохранённые взаимодействия в один ряд; показывает только существенные ограничения точности. @param props - Согласованный снимок аудитории. @returns Карточка первых взаимодействий или точных новых пользователей. */
export function AnalyticsArrivalCard({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const { current, previous, range } = snapshot;
  const audience = current.audience;
  const restored = audience.restored_users ?? 0;
  const history = audience.first_history_status ?? snapshot.coverage.status;
  const incomplete = history !== 'complete';
  const historical = incomplete || restored > 0;
  const total = audience.new_users + restored;
  const unknown = total === 0 && incomplete;
  /** Сравнивает количество сохранённых первых взаимодействий за одинаковые периоды. */
  const previousTotal = previous ? previous.audience.new_users + (previous.audience.restored_users ?? 0) : undefined;
  const series = [{ key: 'first_interactions', label: 'Новые пользователи', color: '#3b82f6' }];
  /** Показатель и пояснения доступны также в развёрнутом графике. */
  const expandedHeader = <div><p className="analytics-report-value" aria-label={unknown ? 'Количество первых взаимодействий не установлено' : `Первые взаимодействия за период: ${total.toLocaleString('ru-RU')}`}>{unknown ? '—' : total.toLocaleString('ru-RU')}</p>
      {historical && <p className="analytics-arrival-description text-xs text-muted-foreground">{unknown ? 'Недостаточно данных о первом обращении' : 'По первому сохранённому обращению'}</p>}</div>;
  const expandedFooter = <div className="space-y-4"><AnalyticsReportSummary items={[[ 'Пользователи бота за всё время', audience.total_users ], [ 'Взаимодействовали за период', audience.active_users ], [ 'Вернулись за период', audience.returning_users ]]} />
    {historical && <p className="analytics-arrival-note text-xs text-muted-foreground">Первое сохранённое обращение может быть позже фактического прихода. Эти значения не включаются в цену привлечения.</p>}</div>;
  return <section className="analytics-card analytics-report-card analytics-arrival-card border rounded-2xl">
    <header><h3 className="text-lg font-semibold">Новые пользователи</h3>
      {previous && <AnalyticsReportComparison current={total} previous={previousTotal} />}</header>
    {expandedHeader}
    <AnalyticsReportChart compact height={280} expandedHeader={expandedHeader} expandedFooter={expandedFooter} title="Новые пользователи" points={snapshot.points.map(point => ({ date: point.date, end_date: point.end_date, first_interactions: point.new_users + (point.restored_users ?? 0) }))} series={series} timezone={range.timezone} stepMs={range.step_ms} range={range}
      emptyTitle={unknown ? 'Первая дата старых пользователей неизвестна' : 'Нет подтверждённых новых пользователей за период'}
      emptyDescription={unknown ? 'В выбранном периоде первые взаимодействия не установлены. Ранняя история неполная, поэтому реальный приход неизвестен. Для точного учёта новых событий обновите и перезапустите бота.' : 'Первые взаимодействия не зафиксированы в выбранном периоде. Сообщения и возвращения существующих пользователей учитываются отдельно.'} />
    {expandedFooter}
  </section>;
}
