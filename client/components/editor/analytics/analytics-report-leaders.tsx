/** @fileoverview Рейтинги пользователей и групп с прямым переходом к переписке из каждой строки. */
import { AnalyticsHeadingHint, AnalyticsSurfaceHint } from './analytics-heading-hint';
import { useState, type ReactNode } from 'react';
import type { AnalyticsV2Leader, AnalyticsV2Snapshot } from '@shared/analytics/v2';
import {AnalyticsChoosePeriod} from './analytics-choose-period';
import { AnalyticsChartState } from './analytics-chart-state';
import { AnalyticsReportSummary } from './analytics-report-overview';
import { AnalyticsReportChart } from './analytics-report-chart';

/**
 * Показывает рейтинг с видимым периодом и закреплением участника.
 * @param props - Рейтинг и область перехода к диалогу.
 * @returns Карточка лидеров с подробностями.
 */
function Leaders({ title, items, group, observed, projectId, tokenId, controls, messageRanking }: {
  /** Название. */ title: string; /** Строки рейтинга. */ items: AnalyticsV2Leader[]; /** Групповой режим. */ group?: boolean;
  /** Показывать количество сообщений вместо уникальных авторов. */ messageRanking?: boolean;
  /** Рейтинг доступных боту групповых сообщений вместо направленных действий. */ observed?: boolean;
  /** Проект. */ projectId: number; /** Выбранный бот. */ tokenId: number | null;
  /** Переключатель, относящийся только к этой карточке рейтинга. */ controls?: ReactNode;
}) {
  /** Ограничивает все рейтинги людей и групп пятью строками. */
  items = items.slice(0, 5);
  const [selected, setSelected] = useState<string | null>(null);
  const maximum = Math.max(1, ...items.map(item => item.total));
  const chosen = items.find(item => item.id === selected);
  /** Создаёт адрес диалога. @param item - Участник рейтинга. @returns Адрес с контекстом возврата. */
  function dialogLink(item: AnalyticsV2Leader) {
    const params = new URLSearchParams({ tab: 'dialogs', dialogUser: item.id, chatType: group ? 'group' : 'private', analyticsReturn: window.location.pathname + window.location.search });
    if (tokenId != null) params.set('bot', String(tokenId));
    return `/projects/${projectId}?${params}`;
  }
  /** Список и подробности остаются внутри карточки без отдельного окна. */
  const content = <>
    {controls}
    {observed && !messageRanking && <p className="text-xs text-muted-foreground">Авторы наблюдаемой переписки, не все участники группы</p>}
    {!items.length ? <AnalyticsChartState title={observed ? 'Пока нет авторов сообщений' : 'Пока нет действий'} /> : <AnalyticsSurfaceHint label={title}><ol className="analytics-leaders-list space-y-1">{items.map((item, index) => <li key={item.id} className="flex flex-wrap items-center gap-2"><button type="button" aria-expanded={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} className="min-w-0 flex-1 basis-48 p-3 rounded-lg text-left hover:bg-muted/50">
      <span className="flex gap-3"><span className="text-sm text-muted-foreground tabular-nums">{index + 1}</span><span className="min-w-0 flex-1 break-words text-sm">{item.name}</span><span className="text-sm font-semibold tabular-nums">{item.total.toLocaleString('ru-RU')}</span></span>
      <span className="mt-2 block h-2 bg-muted rounded-full"><span className="analytics-leader-bar block h-full rounded-full" style={{ width: `${item.total / maximum * 100}%` }} /></span></button><a href={dialogLink(item)} aria-label={`Открыть ${group ? 'группу' : 'переписку'}: ${item.name}`} className="shrink-0 rounded-md px-3 py-2 text-xs text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{group ? 'Открыть группу' : 'Переписка'}</a></li>)}</ol></AnalyticsSurfaceHint>}
    {chosen && <div className="analytics-report-details space-y-3"><strong className="break-words">{chosen.name}</strong><AnalyticsReportSummary items={messageRanking ? [[ 'Наблюдаемые сообщения', chosen.messages ], [ 'Уникальные авторы', chosen.people ?? 0 ]] : observed ? [[ 'Уникальные авторы', chosen.total ], [ 'Наблюдаемые сообщения', chosen.messages ]] : [[ 'Направленные сообщения', chosen.messages ], [ 'Нажатия кнопок', chosen.callbacks ], [ group ? 'Уникальные люди' : 'Всего действий', chosen.total ]]} /><p className="text-muted-foreground break-all">Telegram ID: {chosen.id}{chosen.username ? ` · @${chosen.username}` : ''}</p><a className="underline underline-offset-4" href={dialogLink(chosen)}>Открыть {group ? 'группу' : 'диалог'}</a></div>}
  </>;
  return <section className="analytics-card analytics-report-card analytics-leaders-compact border rounded-2xl"><header><h3 className="text-lg font-semibold"><AnalyticsHeadingHint label={title} /></h3><AnalyticsChoosePeriod/></header>
    {content}
  </section>;
}
/**
 * Показывает динамику групп и три независимых рейтинга в двух парных строках с одинаковой высотой карточек.
 * @param props - Снимок групп и пользователей.
 * @returns Динамика и рейтинги сообщений, авторов и действий.
 */
export function AnalyticsReportLeaders({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  return <div className="space-y-4"><div className="analytics-report-grid analytics-overview-report-grid analytics-active-leaders-grid analytics-group-pair-grid"><section className="analytics-card analytics-report-card analytics-groups-compact border rounded-2xl"><header><h3 className="text-lg font-semibold"><AnalyticsHeadingHint label="Группы за период" /></h3><AnalyticsChoosePeriod/></header>
    <AnalyticsReportChart compact height={280} title="Группы за период" points={snapshot.points.map(point => ({ date: point.date, end_date: point.end_date, group_directed_actions: point.group_directed_actions, groups_active: point.groups_active }))} series={[{ key: 'group_directed_actions', label: 'Действия с ботами', color: '#a78bfa' }, { key: 'groups_active', label: 'Активные группы', color: '#22d3ee' }]} timezone={snapshot.range.timezone} stepMs={snapshot.range.step_ms} range={snapshot.range} allowCumulative={false} />
    <AnalyticsReportSummary items={[[ 'Активные группы', snapshot.current.groups.active_groups ], [ 'Авторы сообщений в группах', snapshot.current.groups.participants ], [ 'Действия с ботами', snapshot.current.groups.directed_actions ]]} />
    <p className="text-xs text-muted-foreground">Авторы сообщений могут входить в аудиторию бота. Эти показатели не складываются.</p></section>

      <Leaders title="Группы по сообщениям" items={snapshot.leaders.groups_messages ?? []} group observed messageRanking projectId={snapshot.project_id} tokenId={snapshot.token_id} />
    </div>
    <div className="analytics-report-grid analytics-overview-report-grid analytics-active-leaders-grid analytics-group-pair-grid">
      <Leaders title="Группы по авторам переписки" items={snapshot.leaders.groups_observed.map(item => ({ ...item, total: item.people ?? item.total }))} group observed projectId={snapshot.project_id} tokenId={snapshot.token_id} />
      <Leaders title="Действия с ботами" items={snapshot.leaders.groups.map(item => ({ ...item, total: item.people ?? item.total }))} group projectId={snapshot.project_id} tokenId={snapshot.token_id} />
    </div>
  </div>;
}

/**
 * Показывает пять лидеров рядом с графиком активности без повторения списка в разделе групп.
 * @param props - Согласованный снимок пользователей.
 * @returns Карточка пяти самых активных пользователей.
 */
export function AnalyticsUserLeaders({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  return <Leaders title="Топ-5 пользователей" items={snapshot.leaders.users.slice(0, 5)} projectId={snapshot.project_id} tokenId={snapshot.token_id} />;
}
