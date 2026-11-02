/** @fileoverview Проверки исходной цены привлечения при отсутствии курса пересчёта. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { AcquisitionReportTable } from './acquisition-report-table';
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
