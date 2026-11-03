/** @fileoverview Проверки исходной цены привлечения при отсутствии курса пересчёта. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AcquisitionReportTable } from './acquisition-report-table';
import { AcquisitionResultRow } from './acquisition-result-row';
/** Серверный результат с известной исходной ценой и неизвестным пересчётом. */
const report = vi.hoisted(() => ({ rows: [{ placementId: 1, name: 'Канал', tokenId: 3, sourceId: 2, sourceName: 'Канал', newUsers: 200, returningUsers: 5, repeatStarts: 7, spend: { RUB: null, USD: '30.00' }, convertedSpend: null, costPerUser: null, costPerUserByCurrency: { RUB: null, USD: '0.15' }, currency: 'RUB' as const, complete: false, reason: 'Не указан курс у 1 записей' }] }));
vi.mock('./use-acquisition', () => ({ useAcquisitionReport: () => ({ data: report, isLoading: false, isError: false }) }));
it('сохраняет исходную долларовую цену и объясняет недоступный пересчёт', () => {
  const snapshot = { range: { from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', timezone: 'UTC' } } as AnalyticsV2Snapshot;
  render(<AcquisitionReportTable projectId={12} snapshot={snapshot} />);
  expect(screen.getByText('0,15 $')).toBeInTheDocument();
  expect(screen.getByText('30,00 $')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Канал' }));
  expect(screen.getByText('Цена нового после пересчёта')).toBeInTheDocument();
  expect(screen.getByText('Не указан курс у 1 записей')).toBeInTheDocument();
});
it('не дублирует общий выбор периода кнопками календарного дня', () => {
  render(<AcquisitionReportTable projectId={12} />);
  expect(screen.queryByRole('button', { name: 'Сегодня' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Вчера' })).not.toBeInTheDocument();
});

it('открывает бюджет с источником и валютой выбранной пустой ячейки',()=>{
  const onAddBudget=vi.fn();
  render(<AcquisitionReportTable projectId={12} snapshot={{range:{from:'2026-11-01T00:00:00Z',to:'2026-11-02T00:00:00Z',timezone:'UTC'}} as AnalyticsV2Snapshot} onAddBudget={onAddBudget}/>);
  fireEvent.click(screen.getByRole('button',{name:'Указать бюджет RUB: Канал'}));
  expect(onAddBudget).toHaveBeenCalledWith(report.rows[0],'RUB');
});

/** Проверяет, что настройки пересчёта относятся к раскрытому результату. */
it('показывает валюту пересчёта только в подробностях источника', () => {
  render(<AcquisitionReportTable projectId={12} snapshot={{ range: { from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', timezone: 'UTC' } } as AnalyticsV2Snapshot} />);
  expect(screen.queryByLabelText('Валюта пересчёта')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Канал' }));
  expect(screen.getByLabelText('Валюта пересчёта')).toHaveValue('RUB');
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
  expect(screen.queryByLabelText('Валюта пересчёта')).not.toBeInTheDocument();
});
/** Отсутствие метки исключает недоступное действие добавления бюджета. */
it('объясняет отсутствие рекламной метки без недоступной кнопки бюджета', () => {
  render(<table><tbody><AcquisitionResultRow row={{ ...report.rows[0], placementId: null, sourceKey: 'no_marker' }} botName="Все боты" selected={false} onToggle={() => {}} onAddBudget={vi.fn()} /></tbody></table>);
  expect(screen.queryByRole('button', { name: /Указать бюджет/ })).not.toBeInTheDocument();
  expect(screen.getByTitle('У этой категории нет рекламной метки')).toBeInTheDocument();
});
/** Табличный отчёт не объявляется графиком при ожидании снимка. */
it('называет загрузку рекламным отчётом', () => {
  render(<AcquisitionReportTable projectId={12} />);
  expect(screen.getByRole('status')).toHaveTextContent('Загрузка рекламного отчёта');
  expect(screen.queryByText('Загрузка графика')).not.toBeInTheDocument();
});

/** В длинной таблице подробности должны появляться рядом с источником. */
it('раскрывает сведения сразу после выбранной строки и закрывает повторным нажатием', () => {
  report.rows.push({ ...report.rows[0], placementId: 2, name: 'Второй канал', sourceName: 'Второй канал' });
  try {
    render(<AcquisitionReportTable projectId={12} snapshot={{ range: { from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', timezone: 'UTC' } } as AnalyticsV2Snapshot} />);
    const trigger = screen.getByRole('button', { name: 'Канал' });
    fireEvent.click(trigger);
    const details = screen.getByRole('region', { name: 'Подробности: Канал' });
    expect(trigger.closest('tr')?.nextElementSibling).toContainElement(details);
    expect(details.closest('tr')?.nextElementSibling).toContainElement(screen.getByRole('button', { name: 'Второй канал' }));
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toContainElement(details);
    fireEvent.click(trigger);
    expect(screen.queryByRole('region', { name: 'Подробности: Канал' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  } finally { report.rows.pop(); }
});

/** Ввод расхода остаётся внутри раскрытой строки и получает выбранную валюту. */
it('встраивает форму расхода в подробности без перехода на другую вкладку', () => {
  const renderBudget = vi.fn((_row, currency, onDone) => <div>Ввод расхода {currency}<button onClick={onDone}>Отменить ввод</button></div>);
  render(<AcquisitionReportTable projectId={12} snapshot={{ range: { from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', timezone: 'UTC' } } as AnalyticsV2Snapshot} renderBudget={renderBudget} />);
  fireEvent.click(screen.getByRole('button', { name: 'Канал' }));
  fireEvent.change(screen.getByLabelText('Валюта пересчёта'), { target: { value: 'USD' } });
  fireEvent.click(screen.getByRole('button', { name: 'Добавить расход' }));
  expect(screen.getByRole('region', { name: 'Подробности: Канал' })).toHaveTextContent('Ввод расхода USD');
  expect(renderBudget).toHaveBeenLastCalledWith(report.rows[0], 'USD', expect.any(Function));
  fireEvent.click(screen.getByRole('button', { name: 'Отменить ввод' }));
  expect(screen.getByRole('button', { name: 'Добавить расход' })).toBeInTheDocument();
});
