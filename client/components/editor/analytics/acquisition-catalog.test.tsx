/** @fileoverview Проверки поиска и отсутствия архивирования и переименования в рекламном каталоге. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AcquisitionCatalog } from './acquisition-catalog';
import type { AcquisitionCatalog as Catalog } from './acquisition-types';
/** Перехватывает запись источника без реального запроса. */
const mutation = vi.hoisted(() => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false, isError: false }));
vi.mock('./use-acquisition', () => ({ useAcquisitionMutation: () => mutation }));
/** Каталог с действующим и архивным источниками. */
const catalog: Catalog = {
  sources: [{ id: 1, name: 'Канал', kind: 'telegram', url: null, archivedAt: null }, { id: 2, name: 'Старый', kind: 'website', url: null, archivedAt: '2026-10-01' }],
  placements: [{ id: 1, sourceId: 1, tokenId: 9, name: 'Канал', startsOn: null, endsOn: null, timezone: 'UTC', archivedAt: null }],
  links: [], expenses: [{ id: 1, placementId: 1, amount: '100', currency: 'RUB', day: '2026-11-01', exchangeRateRubPerUsd: '95.00000000', note: 'Подробное примечание' }],
};
/** Поиск сохраняет список действующих источников без управления архивом. */
it('фильтрует источники поиском', () => {
  render(<AcquisitionCatalog projectId={12} catalog={catalog} onEditExpense={vi.fn()} />);
  expect(screen.getByText('Канал', { selector: 'span' })).toBeInTheDocument();
  expect(screen.queryByText('Старый')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Поиск в ссылках и бюджетах'), { target: { value: 'нет' } });
  expect(screen.queryByText('Канал', { selector: 'span' })).not.toBeInTheDocument();
});
/** Каталог не предлагает переименование, архивирование или отмену расходов. */
it('не показывает удалённые действия управления каталогом', () => {
  render(<AcquisitionCatalog projectId={12} catalog={catalog} onEditExpense={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /Переименовать|В архив|Восстановить|Отменить расход|^Архив$/ })).not.toBeInTheDocument();
});

/** История сохраняет редактирование расхода и короткие числовые форматы. */
it('передаёт исходный расход на редактирование и форматирует историю', () => {
  const edit = vi.fn();
  render(<AcquisitionCatalog projectId={12} catalog={catalog} onEditExpense={edit} />);
  fireEvent.click(screen.getByText('История рекламных бюджетов'));
  expect(screen.getByText('1 нояб. 2026 г.')).toBeInTheDocument();
  expect(screen.getByText('95')).toBeInTheDocument();
  expect(screen.queryByText('95.00000000')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Изменить расход: Канал' }));
  expect(edit).toHaveBeenCalledWith(catalog.expenses[0]);
});
/** Недоступная ссылка не копируется; ошибка буфера явно показана пользователю. */
it('обрабатывает копирование ссылки и ошибку буфера', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const link = { id: 1, sourceId: 1, placementId: 1, tokenId: 9, code: 'channel', purpose: 'advertising', referrerId: null, url: 'https://t.me/TestBot?start=channel', archivedAt: null };
  render(<AcquisitionCatalog projectId={12} catalog={{ ...catalog, links: [link, { ...link, id: 2, url: null }] }} onEditExpense={vi.fn()} />);
  fireEvent.click(screen.getByText('Готовые ссылки'));
  const buttons = screen.getAllByRole('button', { name: 'Копировать' });
  expect(buttons[1]).toBeDisabled();
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Скопировано' })).toBeInTheDocument());
  expect(writeText).toHaveBeenCalledWith(link.url);
  writeText.mockRejectedValueOnce(new Error('Нет доступа'));
  fireEvent.click(screen.getByRole('button', { name: 'Скопировано' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не удалось скопировать'));
});
