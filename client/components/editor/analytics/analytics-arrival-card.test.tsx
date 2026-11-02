/** @fileoverview Проверки восстановленной аудитории, смешанной точности и переключения периода. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AnalyticsArrivalCard } from './analytics-arrival-card';
import { AnalyticsReportLeaders } from './analytics-report-leaders';
import { AnalyticsReportOverview } from './analytics-report-overview';
/** Список значений сохраняет реальные данные графика без зависимости от размера SVG в jsdom. */
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, ComposedChart: () => null, Line: () => null, Area: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, ReferenceLine: () => null, ReferenceDot: () => null }));
/** Создаёт реалистичный снимок восстановленной истории с независимыми сообщениями. */
function snapshot(options: {
  /** Подтверждённые новые люди. */ confirmed?: number;
  /** Люди с первой сохранённой, но не доказанной исходной датой. */ restored?: number;
  /** Полнота первых дат в выбранном окне. */ status?: 'complete' | 'partial' | 'unavailable';
  /** Есть ли восстановимые события в этом окне. */ events?: boolean;
  /** Аудитория за всё время независимо от выбранного периода. */ total?: number;
} = {}): AnalyticsV2Snapshot {
  const { confirmed = 0, restored = 260, status = 'partial', events = true, total = 260 + confirmed } = options;
  const empty = { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 };
  const chat_scopes = { private: { ...empty }, group: { ...empty } };
  return { schema_version: 2, project_id: 12, token_id: 9, revision: '5', as_of: '2026-11-02T00:00:00Z',
    range: { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z', timezone: 'Europe/Moscow', step_ms: 86400000, period: '30d' },
    coverage: { status, from: null, legacy_unknown_users: status === 'complete' ? 0 : 260, bots: [], description: 'Ранняя история восстановлена по сохранённым действиям.' },
    current: { audience: { new_users: confirmed, restored_users: restored, first_history_status: status, total_users: total, active_users: 260 + confirmed, returning_users: 0, unknown_first_users: status === 'complete' ? 0 : 260 },
      messages: { total: 81000, incoming: 81000, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0, chat_scopes, system: 0 }, groups: { active_groups: 0, participants: 0, directed_actions: 0 } },
    previous: null, points: events ? [{ date: '2026-10-20T00:00:00Z', new_users: confirmed, restored_users: restored, active_users: 260 + confirmed, returning_users: 0, incoming: 81000, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0, chat_scopes, system: 0, groups_active: 0, group_participants: 0, group_directed_actions: 0 }] : [],
    leaders: { users: [], groups: [], groups_observed: [] }, sources: [], previous_sources: null, source_points: [], buttons: [], availability: { available: 0, blocked: 0, deleted: 0, checked_at: null },
    composition: { premium: 0, regular: 0, unknown: 260, languages: [] }, next_recompute_at: null };
}
it('возвращает на график 260 восстановленных людей при нуле точных новых', () => {
  render(<AnalyticsArrivalCard snapshot={snapshot()} />);
  expect(screen.getByRole('heading', { name: 'Новые пользователи' })).toBeInTheDocument();
  expect(screen.getByLabelText('Первые взаимодействия за период: 260')).toHaveTextContent('260');
  expect(screen.queryByText('Первая дата старых пользователей неизвестна')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Все значения графика'));
  expect(screen.queryByText('Восстановленная история')).not.toBeInTheDocument();
  const point = screen.getByRole('button', { name: /Новые пользователи: 260/ });
  fireEvent.click(point);
  expect(point).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('button', { name: 'Что это за график?' })).not.toBeInTheDocument();
  expect(screen.getByText(/Эти значения не включаются в цену привлечения/)).toBeInTheDocument();
});
it('показывает смешанную историю одним рядом без потери людей и ложного сравнения', () => {
  const value = snapshot({ confirmed: 12 });
  value.previous = { ...value.current, audience: { ...value.current.audience, restored_users: 100 } };
  render(<AnalyticsArrivalCard snapshot={value} />);
  expect(screen.getByLabelText('Первые взаимодействия за период: 272')).toHaveTextContent('272');
  fireEvent.click(screen.getByText('Все значения графика'));
  expect(screen.getByRole('button', { name: /Новые пользователи: 272/ })).toBeInTheDocument();
  expect(screen.queryByText('Восстановленная история')).not.toBeInTheDocument();
  expect(screen.getByText(/к предыдущему периоду/)).toBeInTheDocument();
});
it('не превращает неизвестную историю без событий в нулевой приход', () => {
  render(<AnalyticsArrivalCard snapshot={snapshot({ restored: 0, events: false, status: 'unavailable' })} />);
  expect(screen.getByLabelText('Количество первых взаимодействий не установлено')).toHaveTextContent('—');
  expect(screen.getByText('Первая дата старых пользователей неизвестна')).toBeInTheDocument();
  expect(screen.queryByText('Все значения графика')).not.toBeInTheDocument();
  expect(screen.getByText(/реальный приход неизвестен/)).toBeInTheDocument();
});
it('сохраняет подтверждённого пользователя без временных исторических пометок', () => {
  render(<AnalyticsArrivalCard snapshot={snapshot({ confirmed: 1, restored: 0, status: 'partial' })} />);
  expect(screen.getByLabelText('Первые взаимодействия за период: 1')).toHaveTextContent('1');
  expect(screen.queryByText('Восстановленная история')).not.toBeInTheDocument();
  expect(screen.queryByText(/Ноль подтверждённых новых пользователей/)).not.toBeInTheDocument();
});
it('при смене периода заменяет восстановленную историю точными новыми и корректным нулём', () => {
  const view = render(<AnalyticsArrivalCard snapshot={snapshot()} />);
  const precise = snapshot({ confirmed: 7, restored: 0, status: 'complete' });
  precise.range = { ...precise.range, from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', period: '24h' };
  precise.points[0].date = precise.range.from;
  precise.previous = { ...precise.current, audience: { ...precise.current.audience, new_users: 5 } };
  view.rerender(<AnalyticsArrivalCard snapshot={precise} />);
  expect(screen.getByRole('heading', { name: 'Новые пользователи' })).toBeInTheDocument();
  expect(screen.getByLabelText('Первые взаимодействия за период: 7')).toHaveTextContent('7');
  expect(screen.queryByText('Восстановленная история')).not.toBeInTheDocument();
  expect(screen.getByText('+2 (+40%) к предыдущему периоду')).toBeInTheDocument();
  view.rerender(<AnalyticsArrivalCard snapshot={snapshot({ restored: 0, status: 'complete', events: false })} />);
  expect(screen.getByLabelText('Первые взаимодействия за период: 0')).toHaveTextContent('0');
  expect(screen.queryByLabelText('Количество первых взаимодействий не установлено')).not.toBeInTheDocument();
});
it('уточняет восстановленную аудиторию, сохраняя отдельный смысл наблюдаемых групповых авторов', () => {
  const first = snapshot();
  first.current.groups.participants = 1492;
  const view = render(<><AnalyticsArrivalCard snapshot={first} /><AnalyticsReportLeaders snapshot={first} /></>);
  const updated = snapshot({ restored: 283, total: 283 });
  updated.current.groups.participants = 1492;
  view.rerender(<><AnalyticsArrivalCard snapshot={updated} /><AnalyticsReportLeaders snapshot={updated} /></>);
  expect(screen.getByLabelText('Первые взаимодействия за период: 283')).toHaveTextContent('283');
  expect(screen.getByText('Пользователи бота за всё время').parentElement).toHaveTextContent('283');
  expect(screen.getByText('Авторы сообщений в группах').parentElement).toHaveTextContent(/1\s492/);
  const card = screen.getByRole('heading', { name: 'Новые пользователи' }).closest('section')!;
  expect(within(card).queryByRole('button', { name: 'Что это за график?' })).not.toBeInTheDocument();
  expect(screen.getByText(/Первое сохранённое обращение может быть позже фактического прихода/)).toBeInTheDocument();
  expect(screen.getByText(/Авторы сообщений могут входить в аудиторию бота/)).toBeInTheDocument();
  const next = snapshot({ confirmed: 1, restored: 0, total: 284 });
  next.range = { ...next.range, from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', period: '24h' };
  view.rerender(<AnalyticsArrivalCard snapshot={next} />);
  expect(screen.getByLabelText('Первые взаимодействия за период: 1')).toHaveTextContent('1');
  expect(screen.getByText('Пользователи бота за всё время').parentElement).toHaveTextContent('284');
  expect(screen.getByText('Пользователи бота за всё время')).toBeInTheDocument();
});
it('в режиме наблюдаемой переписки раскрывает сообщения без ложных нажатий или действий с ботом', () => {
  const value = snapshot();
  value.leaders.groups = [{ id: '-1001', name: 'Группа проекта', username: null, messages: 120, callbacks: 4, total: 124 }];
  value.leaders.groups_observed = [{ ...value.leaders.groups[0], messages: 300, callbacks: 0, total: 300, people: 3 }];
  render(<AnalyticsReportLeaders snapshot={value} />);
  fireEvent.click(screen.getByRole('button', { name: /Группа проекта/ }));
  expect(screen.getByText('Направленные сообщения').parentElement).toHaveTextContent('120');
  expect(screen.getByText('Нажатия кнопок').parentElement).toHaveTextContent('4');
  fireEvent.click(screen.getByRole('button', { name: 'Наблюдаемая переписка' }));
  const observed = within(screen.getByRole('heading', { name: 'Группы по авторам переписки' }).closest('section')!);
  expect(observed.getByText('Уникальные авторы').parentElement).toHaveTextContent('3');
  expect(observed.getByText('Наблюдаемые сообщения').parentElement).toHaveTextContent('300');
  expect(observed.queryByText('Нажатия кнопок')).not.toBeInTheDocument();
  expect(observed.queryByText('Всего действий')).not.toBeInTheDocument();
  expect(observed.queryByText(/1 окт\. 2026.*1 нояб\. 2026.*Europe\/Moscow/)).not.toBeInTheDocument();
  expect(observed.queryByRole('button', { name: /Развернуть график/ })).not.toBeInTheDocument();
  expect(observed.getByTitle(/1 окт\. 2026.*1 нояб\. 2026.*Europe\/Moscow/)).toBeInTheDocument();
});

it('показывает нажатия отдельно от суммы сообщений и обновляет их при смене периода', () => {
  const value = snapshot();
  value.current.messages = { ...value.current.messages, total: 12, incoming: 5, incoming_to_bot: 5, outgoing: 7, callbacks: 4, historical_callbacks: 3, system: 0 };
  value.points[0].callbacks = 4;
  value.points[0].historical_callbacks = 3;
  const view = render(<AnalyticsReportOverview snapshot={value} />);
  const card = within(screen.getByRole('heading', { name: 'Сообщения' }).closest('section')!);
  expect(card.getByText('Нажатия кнопок', { selector: 'dt' }).parentElement).toHaveTextContent('7');
  expect(card.getByText('12')).toBeInTheDocument();
  fireEvent.click(card.getByText('Все значения графика'));
  expect(card.getByRole('button', { name: /Нажатия кнопок: 7/ })).toBeInTheDocument();
  expect(card.queryByRole('button', { name: 'Что это за график?' })).not.toBeInTheDocument();
  expect(card.getByText('Нажатия кнопок не входят в итог сообщений')).toBeInTheDocument();
  const next = snapshot();
  next.current.messages = { ...next.current.messages, total: 2, incoming: 1, incoming_to_bot: 1, outgoing: 1, callbacks: 0, historical_callbacks: 0, system: 0 };
  view.rerender(<AnalyticsReportOverview snapshot={next} />);
  expect(card.getByText('Нажатия кнопок', { selector: 'dt' }).parentElement).toHaveTextContent('0');
  expect(card.getByText('2')).toBeInTheDocument();
});

it('переключает тип чата для графика, сводки и сравнения, сохраняя неизвестные в общем итоге', () => {
  const value = snapshot();
  const personal = { incoming: 3, incoming_to_bot: 3, outgoing: 2, callbacks: 1, historical_callbacks: 2 };
  const group = { incoming: 6, incoming_to_bot: 4, outgoing: 1, callbacks: 2, historical_callbacks: 1 };
  value.current.messages = { ...value.current.messages, incoming: 11, incoming_to_bot: 7, outgoing: 4, total: 15, callbacks: 4,
    historical_callbacks: 3, chat_scopes: { private: personal, group } };
  value.points[0] = { ...value.points[0], incoming: 11, incoming_to_bot: 7, outgoing: 4, callbacks: 4, historical_callbacks: 3, chat_scopes: { private: personal, group } };
  value.previous = { ...value.current, messages: { ...value.current.messages, incoming: 5, incoming_to_bot: 3, outgoing: 2, total: 7,
    chat_scopes: { private: { ...personal, incoming: 1, incoming_to_bot: 1, outgoing: 1 }, group: { ...group, incoming: 2, incoming_to_bot: 2, outgoing: 1 } } } };
  render(<AnalyticsReportOverview snapshot={value} />);
  const card = within(screen.getByRole('heading', { name: 'Сообщения' }).closest('section')!);
  expect(card.getByText('11')).toBeInTheDocument();
  expect(card.queryByText('Другие чаты', { selector: 'dt' })).not.toBeInTheDocument();
  fireEvent.click(card.getByRole('button', { name: 'Личные' }));
  expect(card.getByText('5')).toBeInTheDocument();
  expect(card.getByText('+3 (+150%) к предыдущему периоду')).toBeInTheDocument();
  fireEvent.click(card.getByText('Все значения графика'));
  expect(card.getByRole('button', { name: /Входящие: 3.*Ответы бота: 2.*Нажатия кнопок: 3/ })).toBeInTheDocument();
  fireEvent.click(card.getByRole('button', { name: 'Группы' }));
  expect(card.getByText('+2 (+66,7%) к предыдущему периоду')).toBeInTheDocument();
  expect(card.getByRole('button', { name: /Входящие: 4.*Ответы бота: 1.*Нажатия кнопок: 3/ })).toBeInTheDocument();
});
