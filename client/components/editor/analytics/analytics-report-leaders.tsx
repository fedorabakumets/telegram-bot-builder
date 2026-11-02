/** @fileoverview Рейтинги пользователей и групп с прямым переходом к переписке из каждой строки. */
import { useState, type ReactNode } from 'react';
import type { AnalyticsV2Leader, AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsChartState } from './analytics-chart-state';
import { AnalyticsReportSummary } from './analytics-report-overview';
import { AnalyticsReportChart } from './analytics-report-chart';
import { reportRangeLabel } from './analytics-report-filter';

/**
 * Показывает рейтинг с видимым периодом и закреплением участника.
 * @param props - Рейтинг и область перехода к диалогу.
 * @returns Карточка лидеров с подробностями.
 */
function Leaders({ title, items, group, observed, projectId, tokenId, contextLabel, controls, messageRanking }: {
  /** Название. */ title: string; /** Строки рейтинга. */ items: AnalyticsV2Leader[]; /** Групповой режим. */ group?: boolean;
  /** Показывать количество сообщений вместо уникальных авторов. */ messageRanking?: boolean;
  /** Рейтинг доступных боту групповых сообщений вместо направленных действий. */ observed?: boolean;
  /** Проект. */ projectId: number; /** Выбранный бот. */ tokenId: number | null;
  /** Точные границы периода рейтинга. */ contextLabel: string;
  /** Переключатель, относящийся только к этой карточке рейтинга. */ controls?: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const maximum = Math.max(1, ...items.map(item => item.total));
  const chosen = items.find(item => item.id === selected);
  /** Создаёт адрес диалога. @param item - Участник рейтинга. @returns Адрес с контекстом возврата. */
  function dialogLink(item: AnalyticsV2Leader) {
    const params = new URLSearchParams({ tab: 'dialogs', dialogUser: item.id, chatType: group ? 'group' : 'private', analyticsReturn: window.location.pathname + window.location.search });
    if (tokenId != null) params.set('bot', String(tokenId));
    return `/projects/${projectId}?${params}`;
  }
  return <section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">{title}</h3></header>
    {controls}
    <p className="text-xs text-muted-foreground">{contextLabel}</p>
    <p className="text-sm text-muted-foreground">{messageRanking ? 'Входящие сообщения, которые бот увидел в каждой группе за выбранный период. Нажатия кнопок и ответы бота не включены.' : observed ? 'Уникальные авторы групповых сообщений за выбранный период, включая обычную переписку. Это не общее число участников группы.' : group ? 'Уникальные люди, взаимодействовавшие с ботом в группе за период, включая проверенную старую историю.' : 'Направленные сообщения и настоящие нажатия кнопок за выбранный период.'}</p>
    {!items.length ? <AnalyticsChartState title={observed ? 'Пока нет авторов сообщений' : 'Пока нет действий'} description={observed ? 'В выбранном периоде бот не наблюдал групповых сообщений.' : 'Рейтинг появится после взаимодействий в выбранном периоде.'} /> : <ol className="space-y-2">{items.map((item, index) => <li key={item.id} className="flex flex-wrap items-center gap-2"><button type="button" aria-expanded={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} className="min-w-0 flex-1 basis-48 p-3 rounded-lg text-left hover:bg-muted/50">
      <span className="flex gap-3"><span className="text-sm text-muted-foreground tabular-nums">{index + 1}</span><span className="min-w-0 flex-1 break-words text-sm">{item.name}</span><span className="text-sm font-semibold tabular-nums">{item.total.toLocaleString('ru-RU')}</span></span>
      <span className="mt-2 block h-2 bg-muted rounded-full"><span className="block h-full bg-primary rounded-full" style={{ width: `${item.total / maximum * 100}%` }} /></span></button><a href={dialogLink(item)} aria-label={`Открыть ${group ? 'группу' : 'переписку'}: ${item.name}`} className="shrink-0 rounded-md px-3 py-2 text-xs text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{group ? 'Открыть группу' : 'Переписка'}</a></li>)}</ol>}
    {chosen && <div className="analytics-report-details space-y-3"><strong className="break-words">{chosen.name}</strong><AnalyticsReportSummary items={messageRanking ? [[ 'Наблюдаемые сообщения', chosen.messages ], [ 'Уникальные авторы', chosen.people ?? 0 ]] : observed ? [[ 'Уникальные авторы', chosen.total ], [ 'Наблюдаемые сообщения', chosen.messages ]] : [[ 'Направленные сообщения', chosen.messages ], [ 'Нажатия кнопок', chosen.callbacks ], [ group ? 'Уникальные люди' : 'Всего действий', chosen.total ]]} /><p className="text-muted-foreground break-all">Telegram ID: {chosen.id}{chosen.username ? ` · @${chosen.username}` : ''}</p><a className="underline underline-offset-4" href={dialogLink(chosen)}>Открыть {group ? 'группу' : 'диалог'}</a></div>}
  </section>;
}
/**
 * Показывает отдельные режимы групп и рейтинги в одном периоде.
 * @param props - Снимок групп и пользователей.
 * @returns Общая статистика групп и два рейтинга.
 */
export function AnalyticsReportLeaders({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const [observed, setObserved] = useState(false);
  return <div className="space-y-4"><section className="analytics-card analytics-report-card border rounded-2xl"><header><h3 className="text-lg font-semibold">Группы за период</h3></header>
    <AnalyticsReportSummary items={[[ 'Активные группы', snapshot.current.groups.active_groups ], [ 'Авторы сообщений в группах', snapshot.current.groups.participants ], [ 'Действия с ботами', snapshot.current.groups.directed_actions ]]} />
    <p className="text-sm text-muted-foreground">Авторы сообщений — уникальные люди, чьи сообщения в группах бот наблюдал за выбранный период. Это не общее число участников чатов.</p>
    <AnalyticsReportChart points={snapshot.points.map(point => ({ ...point }))} series={[{ key: 'group_directed_actions', label: 'Действия с ботами', color: '#a78bfa' }, { key: 'groups_active', label: 'Активные группы', color: '#22d3ee' }]} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range} allowCumulative={false} />
    <div className="space-y-2 text-sm text-muted-foreground"><p>Автор групповых сообщений может одновременно быть пользователем бота. Эти показатели пересекаются: их нельзя складывать или вычитать для подсчёта разных людей.</p>
      <p>Обычная переписка сама по себе не подтверждает использование бота. Настройки приватности Telegram могут ограничивать наблюдение.</p></div></section>

    <Leaders title="Самые активные пользователи" items={snapshot.leaders.users} projectId={snapshot.project_id} tokenId={snapshot.token_id} contextLabel={reportRangeLabel(snapshot.range)} />
    <div className="analytics-report-grid">
      <Leaders controls={<div className="analytics-segments w-fit" role="group" aria-label="Методика рейтинга групп"><button type="button" aria-pressed={!observed} onClick={() => setObserved(false)}>Действия с ботами</button><button type="button" aria-pressed={observed} onClick={() => setObserved(true)}>Наблюдаемая переписка</button></div>} title={observed ? 'Группы по авторам переписки' : 'Группы по взаимодействовавшим людям'} items={(observed ? snapshot.leaders.groups_observed : snapshot.leaders.groups).map(item => ({ ...item, total: item.people ?? item.total }))} group observed={observed} projectId={snapshot.project_id} tokenId={snapshot.token_id} contextLabel={reportRangeLabel(snapshot.range)} />
      <Leaders title="Группы по сообщениям" items={snapshot.leaders.groups_messages ?? []} group observed messageRanking projectId={snapshot.project_id} tokenId={snapshot.token_id} contextLabel={reportRangeLabel(snapshot.range)} />
    </div>
  </div>;
}
