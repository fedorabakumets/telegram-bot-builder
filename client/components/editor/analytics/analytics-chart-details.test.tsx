/** @fileoverview Проверка доступного раскрытия графиков и сохранения выбора при живом обновлении. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import {AnalyticsChartRangeContext,chartRangeFilter} from './analytics-chart-range-selection';
import {reportParams} from './analytics-report-filter';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsCompactTooltip } from './analytics-compact-tooltip';
import { AnalyticsReportOverview } from './analytics-report-overview';
import { AnalyticsSnapshotRefreshContext } from './analytics-chart-actions';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
/** Перехватывает настройки плавающей подсказки для проверки формата даты. */
const tooltipMock = vi.hoisted(() => vi.fn((_props: any) => null));
/** Рендер SVG не нужен для проверки доступных контролов и состояния выбора. */
vi.mock('recharts', () => ({ ResponsiveContainer: ({children}:any) => <div>{children}</div>, ComposedChart: ({data,onMouseMove,onMouseLeave,onClick,children}:any) => <div data-testid="chart" onMouseMove={()=>onMouseMove?.({activeLabel:data[data.length-1].date})} onMouseLeave={()=>onMouseLeave?.()} onClick={()=>onClick?.({activeLabel:data[0].date})}>{children}</div>, Line: () => null, Area: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: tooltipMock, ReferenceLine: ({x}:any) => <i data-testid="pinned-line" data-date={x} />, ReferenceDot: ({x}:any) => <i data-testid="pinned-dot" data-date={x} /> }));
it('показывает в подсказке все ряды, включая нулевые и пятый показатель', () => {
  render(<AnalyticsCompactTooltip active label="2026-11-01" formatInterval={() => 'Период'} payload={[{name:'Первый',value:0},{name:'Второй',value:2},{name:'Третий',value:3},{name:'Четвёртый',value:4},{name:'Пятый',value:5}]} />);
  expect(screen.getByText('Первый').parentElement).toHaveTextContent('0');
  expect(screen.getByText('Пятый').parentElement).toHaveTextContent('5');
});
it('закрывает выбранный промежуток только при нажатии вне графика и карточки', () => {
  render(<AnalyticsReportChart points={[{date:'2026-11-01T00:00:00Z',incoming:7}]} series={[{key:'incoming',label:'Входящие',color:'#10b981'}]} timezone="UTC" stepMs={86400000} />);
  fireEvent.click(screen.getByTestId('chart'));
  fireEvent.pointerDown(screen.getByTestId('chart'));
  fireEvent.pointerDown(screen.getByText('За этот промежуток'));
  expect(screen.getByRole('button', {name:'Закрыть'})).toBeInTheDocument();
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('button', {name:'Закрыть'})).not.toBeInTheDocument();
  expect(screen.queryByTestId('pinned-line')).not.toBeInTheDocument();
});
it('сохраняет выделение точки и её значения при движении и уходе указателя', () => {
  const first = '2026-11-01T00:00:00Z';
  render(<AnalyticsReportChart points={[{date:first,incoming:7},{date:'2026-11-02T00:00:00Z',incoming:12}]} series={[{key:'incoming',label:'Входящие',color:'#10b981'}]} timezone="UTC" stepMs={86400000} />);
  fireEvent.click(screen.getByTestId('chart'));
  fireEvent.mouseMove(screen.getByTestId('chart'));
  fireEvent.mouseLeave(screen.getByTestId('chart'));
  expect(screen.getByTestId('pinned-line')).toHaveAttribute('data-date', first);
  expect(screen.getByTestId('pinned-dot')).toHaveAttribute('data-date', first);
  expect(document.querySelector('.analytics-selected-interval-values')).toHaveTextContent('7');
  fireEvent.click(screen.getByRole('button', {name:'Закрыть'}));
  expect(screen.queryByTestId('pinned-line')).not.toBeInTheDocument();
});
it('сохраняет тип и выбранную точку при увеличении и закрытии графика', () => {
  render(<AnalyticsReportChart title="Сообщения" points={[{ date: '2026-11-01T00:00:00Z', incoming: 7 }]} series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="UTC" stepMs={86400000} />);
  fireEvent.click(screen.getByRole('button', { name: 'Столбцы', exact: true }));
  fireEvent.click(screen.getByTestId('chart'));
  const open = screen.getByRole('button', { name: 'Развернуть график: Сообщения' });
  fireEvent.pointerDown(open); fireEvent.click(open);
  expect(screen.getByRole('dialog', { name: 'Сообщения' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Столбцы', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByTestId('pinned-line')).toBeInTheDocument();
  const close = screen.getByRole('button', { name: 'Закрыть график' });
  fireEvent.pointerDown(close); fireEvent.click(close);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Столбцы', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByTestId('pinned-line')).toBeInTheDocument();
});
it('обновляет общий снимок в увеличенном окне и не дублирует кнопку в карточке', () => {
  const refresh = vi.fn();
  render(<AnalyticsSnapshotRefreshContext.Provider value={{ refresh, busy: false, error: 'Не удалось обновить данные. Попробуйте ещё раз.' }}>
    <AnalyticsReportChart points={[]} series={[]} timezone="UTC" stepMs={86400000} /></AnalyticsSnapshotRefreshContext.Provider>);
  expect(screen.queryByRole('button', { name: 'Обновить данные аналитики' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Развернуть график' }));
  fireEvent.click(screen.getByRole('button', { name: 'Обновить данные аналитики' }));
  expect(refresh).toHaveBeenCalledOnce();
  expect(screen.getByRole('alert')).toHaveTextContent('Попробуйте ещё раз');
});
it('закрепляет полное значение и обновляет его без сброса выбора', () => {
  const props = { series: [{ key: 'incoming', label: 'Входящие', color: '#10b981' }], timezone: 'Europe/Moscow', stepMs: 86400000 };
  const point = { date: '2026-11-01T00:00:00Z', incoming: 12 };
  const view = render(<AnalyticsReportChart {...props} points={[point]} />);
  fireEvent.click(screen.getByText('Все значения графика'));
  fireEvent.click(screen.getByRole('button', { name: /Входящие: 12/ }));
  expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Входящие: 12/ })).toHaveAttribute('aria-pressed', 'true');
  view.rerender(<AnalyticsReportChart {...props} points={[{ ...point, incoming: 13 }]} />);
  expect(screen.getByRole('button', { name: /Входящие: 13/ })).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('.analytics-selected-interval-values')).toHaveTextContent('13');
});
it('показывает точные обрезанные границы выбранного интервала и пояс', () => {
  render(<AnalyticsReportChart points={[{ date: '2026-11-01T00:00:00Z', incoming: 2 }]}
    series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="Europe/Moscow" stepMs={86400000}
    range={{ from: '2026-11-01T01:00:00Z', to: '2026-11-01T02:30:00Z' }} />);
  fireEvent.click(screen.getByText('Все значения графика'));
  const value = screen.getByRole('button', { name: /Входящие: 2/ });
  expect(value).toHaveAttribute('title', expect.stringContaining('04:00:00')); expect(value).toHaveAttribute('title', expect.stringContaining('05:30:00')); expect(value).toHaveAttribute('title', expect.stringContaining('Europe/Moscow'));
  expect(value).toHaveTextContent('1 нояб.');
  fireEvent.click(value);
});
it.each([
  ['2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z'],
  ['2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z'],
])('показывает сутки от полуночи до полуночи при смене летнего времени: %s', (date, end_date) => {
  render(<AnalyticsReportChart points={[{ date, end_date, incoming: 7 }]}
    series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="Europe/Berlin" stepMs={86400000} />);
  fireEvent.click(screen.getByText('Все значения графика'));
  const label = screen.getByRole('button', { name: /Входящие: 7/ }).getAttribute('title')!;
  expect(label.match(/00:00:00/g)).toHaveLength(2);
  expect(label).not.toMatch(/01:00:00|23:00:00/);
});
it('объясняет неизвестную первую дату, не объявляя существующие сообщения отсутствующими', () => {
  const snapshot = {
    coverage: { status: 'partial', legacy_unknown_users: 260 },
    range: { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z', timezone: 'Europe/Moscow', step_ms: 86400000 },
    current: { audience: { new_users: 0, restored_users: 0, first_history_status: 'partial', total_users: 260, active_users: 260, returning_users: 0 },
      messages: { total: 81000, incoming: 81000, incoming_to_bot: 81000, outgoing: 0, callbacks: 0, historical_callbacks: 0, system: 0, chat_scopes: { private: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 }, group: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 } } } },
    previous: null, points: [{ date: '2026-10-20T00:00:00Z', new_users: 0, incoming: 81000, incoming_to_bot: 81000, outgoing: 0, callbacks: 0, historical_callbacks: 0,
      chat_scopes: { private: { incoming: 81000, incoming_to_bot: 81000, outgoing: 0, callbacks: 0, historical_callbacks: 0 }, group: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 } } }],
  } as AnalyticsV2Snapshot;
  render(<AnalyticsReportOverview snapshot={snapshot} />);
  expect(screen.getByText('Первая дата старых пользователей неизвестна')).toBeInTheDocument();
  expect(screen.getByLabelText('Количество первых взаимодействий не установлено')).toHaveTextContent('—');
  expect(screen.getByText(/обновите и перезапустите бота/)).toBeInTheDocument();
  expect(screen.queryByText('В выбранном периоде нет событий')).not.toBeInTheDocument();
});

it('закрепляет промежуток нажатием и применяет точные границы',()=>{
  const apply=vi.fn();
  render(<AnalyticsChartRangeContext.Provider value={apply}><AnalyticsReportChart points={[{date:'2026-11-01T00:00:00Z',end_date:'2026-11-02T00:00:00Z',incoming:7}]} series={[{key:'incoming',label:'Входящие',color:'#10b981'}]} timezone="UTC" stepMs={86400000} range={{from:'2026-11-01T01:00:00Z',to:'2026-11-01T02:30:00Z'}}/></AnalyticsChartRangeContext.Provider>);
  fireEvent.click(screen.getByTestId('chart'));fireEvent.mouseLeave(screen.getByTestId('chart'));
  fireEvent.click(screen.getByRole('button',{name:'Выбрать этот период'}));
  const range={from:'2026-11-01T01:00:00.000Z',to:'2026-11-01T02:30:00.000Z'};
  expect(apply).toHaveBeenCalledWith(range);
  const filter=chartRangeFilter({period:'30d',from:'2026-10-03',to:'2026-11-02',timezone:'UTC',compare:false},range);
  const params=reportParams(filter);expect(params.get('from')).toBe(range.from);expect(params.get('to')).toBe(range.to);
});
it('показывает полные сутки русской датой в подсказке', () => {
  render(<AnalyticsReportChart points={[{date:'2026-09-28T00:00:00Z',incoming:7}]} series={[{key:'incoming',label:'Входящие',color:'#10b981'}]} timezone="UTC" stepMs={86400000} />);
  fireEvent.mouseMove(screen.getByTestId('chart'));
  expect(tooltipMock.mock.calls.at(-1)?.[0].content.props.formatInterval('2026-09-28T00:00:00Z')).toBe('Понедельник, 28 сентября 2026 г.');
});

/** Переключатель меняет реальные значения и сохраняет режим в увеличенном окне. */
it('складывает значения при включении накопления и сохраняет переключатель в окне', () => {
  render(<AnalyticsReportChart title="Накопление" points={[{ date: '2026-11-01T00:00:00Z', incoming: 7 }, { date: '2026-11-02T00:00:00Z', incoming: 12 }]} series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="UTC" stepMs={86400000} />);
  fireEvent.click(screen.getByRole('switch', { name: 'Накопительно внутри периода' }));
  expect(screen.getByRole('switch', { name: 'Накопительно внутри периода' })).toBeChecked();
  fireEvent.mouseMove(screen.getByTestId('chart'));
  expect(screen.getByRole('button', { name: /Входящие: 19/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Развернуть график: Накопление' }));
  expect(screen.getByRole('switch', { name: 'Накопительно внутри периода' })).toBeChecked();
});
