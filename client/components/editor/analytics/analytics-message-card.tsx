/** @fileoverview Карточка сообщений с раздельными показателями типов чатов. */
import { useState } from 'react';
import type { AnalyticsV2MessageScope, AnalyticsV2Snapshot, AnalyticsV2Summary } from '@shared/analytics/v2';
import { AnalyticsReportChart, type ReportChartPoint } from './analytics-report-chart';
import { AnalyticsReportComparison, AnalyticsReportSummary } from './analytics-report-metrics';
import { ChartInfoSpoiler } from './chart-info-spoiler';

/** Вариант отображения чатов. */
type Scope = 'all' | 'private' | 'group';
/** Выбирает значения карточки для указанного типа чата. @param messages - Показатели периода. @param scope - Тип чата. @returns Числа выбранной области. */
function selectedMessages(messages: AnalyticsV2Summary['messages'], scope: Scope): AnalyticsV2MessageScope {
  return scope === 'all' ? messages : messages.chat_scopes[scope];
}
/** Показывает сообщения и нажатия с выбором типа чата. @param props - Снимок аналитики. @returns Карточка сообщений. */
export function AnalyticsMessageCard({ snapshot }: { /** Общий снимок. */ snapshot: AnalyticsV2Snapshot }) {
  const [scope, setScope] = useState<Scope>('all');
  const { current, previous, range } = snapshot;
  if (!current.messages.chat_scopes || current.messages.incoming_to_bot == null || snapshot.points.some(point => !point.chat_scopes || point.incoming_to_bot == null) || (previous && (!previous.messages.chat_scopes || previous.messages.incoming_to_bot == null))) {
    return <section className="analytics-card analytics-report-card border rounded-2xl"><h3 className="text-lg font-semibold">Сообщения</h3>
      <p className="text-sm text-muted-foreground">Обновите аналитику, чтобы увидеть данные по типам чатов.</p></section>;
  }
  const values = selectedMessages(current.messages, scope);
  const prior = previous ? selectedMessages(previous.messages, scope) : null;
  const total = values.incoming_to_bot + values.outgoing;
  const points: ReportChartPoint[] = snapshot.points.map(({ chat_scopes, ...point }) => {
    const selected = scope === 'all' ? point : chat_scopes[scope];
    return { ...point, incoming: selected.incoming_to_bot, outgoing: selected.outgoing,
      personal: chat_scopes.private.incoming_to_bot, group: chat_scopes.group.incoming_to_bot,
      button_clicks: selected.callbacks + selected.historical_callbacks };
  });
  const series = scope === 'all' ? [
    { key: 'personal', label: 'Личные', color: '#10b981' }, { key: 'group', label: 'Групповые', color: '#22d3ee' },
  ] : [{ key: 'incoming', label: 'Входящие', color: '#10b981' }];
  series.push({ key: 'outgoing', label: 'Ответы бота', color: '#a78bfa' }, { key: 'button_clicks', label: 'Нажатия кнопок', color: '#f59e0b' });
  const items: Array<[string, number]> = scope === 'all' ? [
    ['Личные входящие', current.messages.chat_scopes.private.incoming_to_bot], ['Групповые входящие', current.messages.chat_scopes.group.incoming_to_bot],
  ] : [['Входящие', values.incoming_to_bot]];
  items.push(['Ответы бота', values.outgoing], ['Нажатия кнопок', values.callbacks + values.historical_callbacks]);
  return <section className="analytics-card analytics-report-card border rounded-2xl">
    <header><h3 className="text-lg font-semibold">Сообщения</h3><AnalyticsReportComparison current={total} previous={prior ? prior.incoming_to_bot + prior.outgoing : undefined} /></header>
    <div><p className="analytics-report-value">{total.toLocaleString('ru-RU')}</p><p className="text-sm text-muted-foreground">сообщения боту и его ответы за период</p></div>
    <div className="analytics-segments w-fit" role="group" aria-label="Тип чата">{([['all', 'Все'], ['private', 'Личные'], ['group', 'Группы']] as const).map(([value, label]) =>
      <button key={value} type="button" aria-pressed={scope === value} onClick={() => setScope(value)}>{label}</button>)}</div>
    <AnalyticsReportChart points={points} series={series} timezone={range.timezone} stepMs={range.step_ms} range={range} />
    <AnalyticsReportSummary items={items} />
    <p className="text-xs text-muted-foreground">Итог — сообщения боту и его успешные ответы. Нажатия кнопок в сумму не входят.</p>
    <ChartInfoSpoiler><p>Личные сообщения и подтверждённые обращения к боту в группах входят в число входящих; обычная переписка групп не учитывается. Старые групповые обращения без подтверждения могли не сохраниться.</p><p>Ответы и нажатия с неизвестным типом чата или из каналов видны только в режиме «Все». Кнопки-ссылки и кнопки клавиатуры не входят в счётчик нажатий.</p></ChartInfoSpoiler>
  </section>;
}
