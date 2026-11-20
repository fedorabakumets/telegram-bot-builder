/** @fileoverview Проверка выбора экспортируемых полей и предпросмотра до записи импорта. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UsersExportDialog } from './users-export-dialog';
import { UsersImportDialog } from './users-import-dialog';
import type { BotToken } from '@shared/schema';
const mocks = vi.hoisted(() => ({ exportUsers: vi.fn(), download: vi.fn(), request: vi.fn() }));
vi.mock('./users-export', () => ({ exportUsers: mocks.exportUsers }));
vi.mock('@/components/editor/tables/utils/download-file', () => ({ downloadFile: mocks.download }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
/** Экспорт соблюдает снятые галочки и передаёт текущие ограничения полной пагинации. */
it('выгружает отмеченные поля текущей выборки', async () => {
  mocks.exportUsers.mockResolvedValue([{ userId: '123', firstName: 'Анна', acquisitionSource: 'direct', userData: { city: 'Москва' } }]);
  render(<UsersExportDialog projectId={12} projectName="Торлинк" tokenId={9} query={{ search: 'Анна', premium: 'true' }} total={1} onClose={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Источник'));
  fireEvent.click(screen.getByRole('button', { name: 'Скачать файл' }));
  await waitFor(() => expect(mocks.download).toHaveBeenCalledOnce());
  expect(mocks.exportUsers.mock.calls[0][0]).toMatchObject({ projectId: 12, tokenId: 9, query: { search: 'Анна', premium: 'true' } });
  const document = JSON.parse(mocks.download.mock.calls[0][0]);
  expect(document.fields).not.toContain('acquisitionSource');
  expect(document.users[0]).toMatchObject({ userId: '123', userData: { city: 'Москва' } });
  expect(document.users[0]).not.toHaveProperty('acquisitionSource');
});
/** Общие кнопки управляют полями, после снятия всех можно выбрать ровно нужные значения. */
it('выбирает username и нажатия независимо от имени и сообщений', async () => {
  mocks.exportUsers.mockResolvedValue([{ userId: '123', firstName: 'Анна', userName: 'anna', incomingMessageCount: 5, buttonClickCount: 7 }]);
  render(<UsersExportDialog projectId={12} projectName="Торлинк" tokenId={9} query={{}} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Снять всё' }));
  expect(screen.getByLabelText('Telegram ID — обязательно')).toBeChecked();
  expect(screen.getByLabelText('Telegram ID — обязательно')).toBeDisabled();
  expect(screen.getAllByRole('checkbox').filter(box => !(box as HTMLInputElement).disabled).every(box => !(box as HTMLInputElement).checked)).toBe(true);
  fireEvent.click(screen.getByLabelText('Username'));
  fireEvent.click(screen.getByLabelText('Нажатия кнопок'));
  fireEvent.click(screen.getByRole('button', { name: 'Скачать файл' }));
  await waitFor(() => expect(mocks.download).toHaveBeenCalledOnce());
  const doc = JSON.parse(mocks.download.mock.calls[0][0]);
  expect(doc.fields).toEqual(['userName', 'buttonClickCount']);
  expect(doc.users[0]).toEqual({ userId: '123', tokenId: 9, userName: 'anna', buttonClickCount: 7 });
});
/** Предпросмотр вызывает только расчёт, запись появляется отдельным действием. */
it('сначала проверяет импорт и только потом записывает выбранного исходного бота', async () => {
  const refresh = vi.fn();
  mocks.request.mockImplementation((_method, _url, body) => Promise.resolve({ total: 1, created: 1, updated: 0, unchanged: 0, applied: body.apply }));
  render(<UsersImportDialog projectId={12} tokenId={9} tokens={[{ id: 9, name: 'Бот' }] as BotToken[]} onClose={vi.fn()} onRefresh={refresh} />);
  const document = { format: 'botcraft-users', version: 1, exportedAt: '', fields: ['variables'], users: [{ userId: '123', memberships: [{ tokenId: 45, name: 'Источник', userData: { city: 'Москва' } }] }] };
  const file = new File([''], 'users.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(document) });
  fireEvent.change(screen.getByLabelText('Файл пользователей'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Проверить импорт' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Проверить импорт' }));
  await screen.findByText('Результат проверки');
  expect(mocks.request.mock.calls[0][2]).toMatchObject({ tokenId: 9, sourceTokenId: 45, apply: false });
  expect(refresh).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Импортировать пользователей' }));
  await screen.findByText('Импорт завершён');
  expect(mocks.request.mock.calls[1][2]).toMatchObject({ tokenId: 9, sourceTokenId: 45, apply: true });
  expect(refresh).toHaveBeenCalledOnce();
});

/** Снятые поля исключаются и из профиля, и из связи с исходным ботом; смена выбора требует нового расчёта. */
it('импортирует только отмеченные данные и сбрасывает предпросмотр после смены галочек', async () => {
  mocks.request.mockResolvedValue({ total: 1, created: 1, updated: 0, unchanged: 0, applied: false });
  render(<UsersImportDialog projectId={12} tokenId={9} tokens={[{ id: 9, name: 'Бот' }] as BotToken[]} onClose={vi.fn()} onRefresh={vi.fn()} />);
  const data = { format: 'botcraft-users', version: 1, exportedAt: '', fields: ['profile', 'variables'], users: [{ userId: '123', firstName: 'Анна', userName: 'anna', userData: { city: 'Москва' }, memberships: [{ tokenId: 45, userData: { city: 'Казань' }, deepLinkParam: 'start' }] }] };
  const file = new File([''], 'users.json');
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(data) });
  fireEvent.change(screen.getByLabelText('Файл пользователей'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Проверить импорт' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Снять всё' }));
  fireEvent.click(screen.getByLabelText('Username'));
  fireEvent.click(screen.getByRole('button', { name: 'Проверить импорт' }));
  await screen.findByText('Результат проверки');
  expect(mocks.request.mock.calls[0][2].users).toEqual([{ userId: '123', userName: 'anna', memberships: [{ tokenId: 45 }] }]);
  expect(screen.getByLabelText('Telegram ID — обязательно')).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Переменные'));
  expect(screen.queryByText('Результат проверки')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Проверить импорт' })).toBeEnabled();
});
