/** @fileoverview Единый график первых взаимодействий без временного оформления исторических данных. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsReportComparison, AnalyticsReportSummary } from './analytics-report-metrics';
import { ChartInfoSpoiler } from './chart-info-spoiler';
/** Объединяет первые сохранённые взаимодействия в один ряд; ограничения точности оставляет в справке. @param props - Согласованный снимок аудитории. @returns Карточка первых взаимодействий или точных новых пользователей. */
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
  return <section className="analytics-card analytics-report-card border rounded-2xl">
    <header><h3 className="text-lg font-semibold">Новые пользователи</h3>
      {previous && <AnalyticsReportComparison current={total} previous={previousTotal} />}</header>
    <div><p className="analytics-report-value" aria-label={unknown ? 'Количество первых взаимодействий не установлено' : `Первые взаимодействия за период: ${total.toLocaleString('ru-RU')}`}>{unknown ? '—' : total.toLocaleString('ru-RU')}</p>
      <p className="text-sm text-muted-foreground">{unknown ? 'данных о первых взаимодействиях за период недостаточно' : historical ? 'человек с первым сохранённым взаимодействием за период' : 'подтверждённых новых пользователей за период'}</p></div>
    <AnalyticsReportChart points={snapshot.points.map(point => ({ ...point, first_interactions: point.new_users + (point.restored_users ?? 0) }))} series={series} timezone={range.timezone} stepMs={range.step_ms} range={range}
      emptyTitle={unknown ? 'Первая дата старых пользователей неизвестна' : 'Нет подтверждённых новых пользователей за период'}
      emptyDescription={unknown ? 'В выбранном периоде первые взаимодействия не установлены. Ранняя история неполная, поэтому реальный приход неизвестен. Для точного учёта новых событий обновите и перезапустите бота.' : 'Первые взаимодействия не зафиксированы в выбранном периоде. Сообщения и возвращения существующих пользователей учитываются отдельно.'} />
    <AnalyticsReportSummary items={[[ 'Пользователи бота за всё время', audience.total_users ], [ 'Взаимодействовали за период', audience.active_users ], [ 'Вернулись за период', audience.returning_users ]]} />
    <p className="text-xs text-muted-foreground">Итог за всё время не зависит от выбранного периода. Учитывается каждый человек с подтверждённым использованием бота.</p>
    <ChartInfoSpoiler><p>Первые взаимодействия показывают людей по дате первого сохранённого обращения. В старых данных эта дата может быть позже настоящего начала использования. Подтверждением служат личные сообщения, адресные команды и нажатия кнопок.</p>
      <p>Обычная переписка группы сама по себе не увеличивает аудиторию. Её автор может одновременно быть пользователем бота, если есть свидетельство направленного взаимодействия. В проекте один человек у нескольких ботов учитывается один раз.</p>
      <p>Взаимодействовали — разные люди с подтверждённым использованием бота в периоде. Вернулись — из них те, кто использовал бота до начала этого периода. Эти показатели не нужно складывать.</p>
      {historical && <><p>Сохранённые свидетельства взаимодействия подтверждают использование бота, но человек мог прийти раньше. Эти значения не включаются в цену привлечения.</p><p>При уточнении старых данных прошлые значения могут измениться. Это не означает, что эти люди пришли сейчас.</p><p>Сравнение основано на сохранённых данных и может измениться при уточнении истории. Исторические свидетельства не добавляют вымышленные сообщения или нажатия в счётчики действий.</p></>}</ChartInfoSpoiler>
  </section>;
}
