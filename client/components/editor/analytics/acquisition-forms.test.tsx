/** @fileoverview Проверки явного распределения оплаты и безопасного редактирования дневного расхода. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AcquisitionExpenseForm } from './acquisition-expense-form';
import type { AcquisitionCatalog, AcquisitionExpense } from './acquisition-types';
/** Записи мутаций для проверки контракта формы. */
const mutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false, isError: false, error: null }));
vi.mock('./use-acquisition', () => ({ useAcquisitionMutation: () => mutation }));
/** Справочник с единственным тестовым размещением. */
const catalog: AcquisitionCatalog = { sources: [], links: [], expenses: [], placements: [{ id: 1, sourceId: 2, tokenId: 3, name: 'Ноябрьская публикация', startsOn: null, endsOn: null, timezone: 'Europe/Moscow', archivedAt: null }] };
beforeEach(() => { mutation.mutateAsync.mockReset(); mutation.mutateAsync.mockResolvedValue({ items: [] }); });
it('не записывает многодневный расход до явного подтверждения предпросмотра', async () => {
  render(<AcquisitionExpenseForm projectId={12} catalog={catalog} timezone="Europe/Moscow" onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText('Источник · обязательно'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Сумма рекламного бюджета · обязательно'), { target: { value: '100,00' } });
  fireEvent.change(screen.getByLabelText('Дата рекламного бюджета'), { target: { value: '2026-11-01' } });
  fireEvent.click(screen.getByLabelText('Распределить сумму рекламного бюджета поровну по нескольким дням'));
  fireEvent.change(screen.getByLabelText('Последний день включительно'), { target: { value: '2026-11-03' } });
  expect(screen.getByText('33,34 ₽')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить рекламный бюджет' }));
  expect(mutation.mutateAsync).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('подтвердите');
  fireEvent.click(screen.getByLabelText(/Подтверждаю распределение/));
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить рекламный бюджет' }));
  await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledOnce());
  expect(mutation.mutateAsync.mock.calls[0][0].body).toMatchObject({ placementId: 1, amount: '100.00', currency: 'RUB', day: '2026-11-01', untilDay: '2026-11-03', allocation: 'equal', note: '' });
});
it('редактирование расхода не отправляет поля создания и сохраняет дату курса', async () => {
  const expense: AcquisitionExpense = { id: 9, placementId: 1, amount: '30.00', currency: 'USD', day: '2026-11-01', exchangeRateRubPerUsd: '95.50', exchangeRateDate: '2026-10-31', note: '' };
  render(<AcquisitionExpenseForm projectId={12} catalog={catalog} timezone="Europe/Moscow" expense={expense} onSaved={() => {}} />);
  expect(screen.getByRole('heading', { name: 'Изменить рекламный бюджет' })).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Сумма рекламного бюджета · обязательно'), { target: { value: '35.00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить рекламный бюджет' }));
  await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledOnce());
  const call = mutation.mutateAsync.mock.calls[0][0];
  expect(call.id).toBe(9); expect(call.body).toMatchObject({ amount: '35.00', exchangeRateDate: '2026-10-31' });
  expect(call.body).not.toHaveProperty('allocation'); expect(call.body).not.toHaveProperty('placementId');
});
