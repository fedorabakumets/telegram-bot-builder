/** @fileoverview Проверка доступного раскрытия графиков и сохранения выбора при живом обновлении. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AnalyticsReportChart } from './analytics-report-chart';
import { AnalyticsReportOverview } from './analytics-report-overview';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
/** Рендер SVG не нужен для проверки доступных контролов и состояния выбора. */
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, ComposedChart: () => null, Area: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null }));
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
  expect(screen.getByText('13')).toBeInTheDocument();
});
it('показывает точные обрезанные границы выбранного интервала и пояс', () => {
  render(<AnalyticsReportChart points={[{ date: '2026-11-01T00:00:00Z', incoming: 2 }]}
    series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="Europe/Moscow" stepMs={86400000}
    range={{ from: '2026-11-01T01:00:00Z', to: '2026-11-01T02:30:00Z' }} />);
  fireEvent.click(screen.getByText('Все значения графика'));
  const value = screen.getByRole('button', { name: /Входящие: 2/ });
  expect(value).toHaveTextContent('04:00:00'); expect(value).toHaveTextContent('05:30:00'); expect(value).toHaveTextContent('Europe/Moscow');
  fireEvent.click(value);
  expect(screen.getByText('Начало включено, окончание не включено.')).toBeInTheDocument();
});
it.each([
  ['2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z'],
  ['2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z'],
])('показывает сутки от полуночи до полуночи при смене летнего времени: %s', (date, end_date) => {
  render(<AnalyticsReportChart points={[{ date, end_date, incoming: 7 }]}
    series={[{ key: 'incoming', label: 'Входящие', color: '#10b981' }]} timezone="Europe/Berlin" stepMs={86400000} />);
  fireEvent.click(screen.getByText('Все значения графика'));
  const label = screen.getByRole('button', { name: /Входящие: 7/ }).textContent!;
  expect(label.match(/00:00:00/g)).toHaveLength(2);
  expect(label).not.toMatch(/01:00:00|23:00:00/);
});
it('объясняет неизвестную первую дату, не объявляя существующие сообщения отсутствующими', () => {
  const snapshot = {
    coverage: { status: 'partial', legacy_unknown_users: 260 },
    range: { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z', timezone: 'Europe/Moscow', step_ms: 86400000 },
    current: { audience: { new_users: 0, restored_users: 0, first_history_status: 'partial', total_users: 260, active_users: 260, returning_users: 0 },
      messages: { total: 81000, incoming: 81000, outgoing: 0, callbacks: 0, system: 0 } },
    previous: null, points: [{ date: '2026-10-20T00:00:00Z', new_users: 0, incoming: 81000, outgoing: 0 }],
  } as AnalyticsV2Snapshot;
  render(<AnalyticsReportOverview snapshot={snapshot} />);
  expect(screen.getByText('Первая дата старых пользователей неизвестна')).toBeInTheDocument();
  expect(screen.getByLabelText('Количество первых взаимодействий не установлено')).toHaveTextContent('—');
  expect(screen.getByText(/обновите и перезапустите бота/)).toBeInTheDocument();
  expect(screen.queryByText('В выбранном периоде нет событий')).not.toBeInTheDocument();
});
