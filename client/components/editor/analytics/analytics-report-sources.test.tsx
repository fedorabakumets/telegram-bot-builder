/** @fileoverview Проверка сравнения источников и неполной истории. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { AnalyticsV2Snapshot, AnalyticsV2Source } from '@shared/analytics/v2';
import { AnalyticsReportSources } from './analytics-report-sources';

vi.mock('recharts', () => ({ ResponsiveContainer: () => null, ComposedChart: () => null, Area: () => null, Bar: () => null,
  XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, ReferenceLine: () => null,
  ReferenceDot: () => null, Cell: () => null, Pie: () => null, PieChart: () => null }));
/** Создаёт значение источника. @param id - Идентификатор. @param count - Первые контакты. @returns Строка источника. */
function source(id: string, count: number): AnalyticsV2Source {
  return { id, label: id, new_users: count, restored_users: 0, returning_users: 0, starts: 0 };
}
/** Создаёт минимальный снимок для карточек источников. @returns Данные двух периодов. */
function snapshot(): AnalyticsV2Snapshot {
  return { sources: [source('Общий', 3), source('Новый', 1)], previous_sources: [source('Общий', 2), source('Прежний', 4)],
    current: { audience: { first_history_status: 'partial' } }, previous: { audience: { first_history_status: 'complete' } },
    points: [], source_points: [], range: { from: '2026-10-20T00:00:00Z', to: '2026-10-30T00:00:00Z', timezone: 'Europe/Moscow', step_ms: 86400000 } } as unknown as AnalyticsV2Snapshot;
}
it('показывает сравнение каждого источника, включая отсутствующий сейчас, и не вычисляет процент от нуля', () => {
  const data = snapshot();
  const view = render(<AnalyticsReportSources snapshot={data} />);
  const distribution = within(screen.getByRole('heading', { name: 'Распределение по источникам' }).closest('section')!);
  expect(distribution.getByRole('button', { name: /Общий/ })).toHaveTextContent('+1 (+50%) к предыдущему периоду · по сохранённым данным');
  expect(distribution.getByRole('button', { name: /Новый/ })).toHaveTextContent('+1 к предыдущему периоду');
  expect(distribution.getByRole('button', { name: /Новый/ })).not.toHaveTextContent('% к предыдущему периоду');
  expect(distribution.getByRole('button', { name: /Прежний/ })).toHaveTextContent('-4');
  const graph = within(screen.getByRole('heading', { name: 'Динамика источников' }).closest('section')!);
  expect(graph.getByText(/-2 .*к предыдущему периоду/)).toHaveTextContent('по сохранённым данным');
  view.rerender(<AnalyticsReportSources snapshot={{ ...data, previous: null, previous_sources: null }} />);
  expect(screen.queryByText(/к предыдущему периоду/)).not.toBeInTheDocument();
  expect(distribution.queryByRole('button', { name: /Прежний/ })).not.toBeInTheDocument();
});
it('оставляет доступным прошлый источник при отсутствии текущих значений', () => {
  const data = snapshot();
  data.sources = [];
  render(<AnalyticsReportSources snapshot={data} />);
  const row = screen.getByRole('button', { name: /Прежний/ });
  expect(row).toHaveTextContent('-4');
  expect(row).not.toHaveTextContent('NaN');
});
it('сохраняет выбранный источник при увеличении и закрытии распределения', () => {
  render(<AnalyticsReportSources snapshot={snapshot()} />);
  const card = within(screen.getByRole('heading', { name: 'Распределение по источникам' }).closest('section')!);
  fireEvent.click(card.getByRole('button', { name: /Общий/ }));
  fireEvent.click(card.getByRole('button', { name: 'Развернуть график: Распределение по источникам' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Распределение по источникам' }));
  expect(dialog.getByRole('button', { name: /Общий/ })).toHaveAttribute('aria-pressed', 'true');
  expect(dialog.getByText('Количество')).toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Закрыть график' }));
  expect(card.getByRole('button', { name: /Общий/ })).toHaveAttribute('aria-pressed', 'true');
});
