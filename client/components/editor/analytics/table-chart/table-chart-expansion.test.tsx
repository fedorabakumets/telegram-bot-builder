/** @fileoverview Проверки сохранения выбора и независимого обновления табличного графика. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TableChartExpansion } from './table-chart-expansion';

vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: { /** Содержимое графика. */ children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null, BarChart: () => null, Bar: () => null, LineChart: () => null, Line: () => null, PieChart: () => null,
  Pie: () => null, Cell: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, LabelList: () => null }));

it('сохраняет категорию при разворачивании, закрытии и обновлении значений', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const props = { data: [{ label: 'Категория', value: 7 }], chartType: 'bar' as const, valueLabel: 'Количество', categoryLabel: 'Тип', refresh, busy: false };
  const view = render(<TableChartExpansion {...props} />);
  fireEvent.click(screen.getByText('Все значения на графике (1)'));
  fireEvent.click(screen.getByRole('button', { name: /Категория\s*7/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Развернуть график: График по таблице' }));
  const dialog = within(screen.getByRole('dialog', { name: 'График по таблице' }));
  expect(dialog.getByRole('region', { name: 'Подробности выбранного значения' })).toHaveTextContent('Категория');
  fireEvent.click(dialog.getByRole('button', { name: 'Закрыть график' }));
  view.rerender(<TableChartExpansion {...props} data={[{ label: 'Категория', value: 8 }]} />);
  expect(screen.getByRole('region', { name: 'Подробности выбранного значения' })).toHaveTextContent('8');
});

it('обновляет только график таблицы и позволяет повторить запрос после ошибки', async () => {
  const refresh = vi.fn().mockRejectedValueOnce(new Error('Ошибка')).mockResolvedValueOnce(undefined);
  const props = { data: [{ label: 'Категория', value: 7 }], chartType: 'line' as const, valueLabel: 'Количество', categoryLabel: 'Тип', refresh, busy: false };
  const view = render(<TableChartExpansion {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Обновить график таблицы' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Попробуйте ещё раз');
  fireEvent.click(screen.getByRole('button', { name: 'Обновить график таблицы' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(refresh).toHaveBeenCalledTimes(2);
  view.rerender(<TableChartExpansion {...props} busy />);
  expect(screen.getByRole('button', { name: 'Обновить график таблицы' })).toBeDisabled();
});
