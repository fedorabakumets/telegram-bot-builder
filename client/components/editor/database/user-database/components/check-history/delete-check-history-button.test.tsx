/** @fileoverview Очистка истории вызывается только после явного подтверждения выбранной области. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DeleteCheckHistoryButton } from './delete-check-history-button';
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
/** Открытие и отмена подтверждения не удаляют данные. */
it('ожидает подтверждения и позволяет отменить очистку', () => {
  render(<QueryClientProvider client={new QueryClient()}><DeleteCheckHistoryButton projectId={12} tokenId={9} kind="private-chats" onDeleted={vi.fn()} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить историю' }));
  expect(screen.getByText(/Общие проверки с участием/)).toBeInTheDocument();
  expect(mocks.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  expect(screen.queryByRole('button', { name: 'Удалить', exact: true })).not.toBeInTheDocument();
});
/** Запрос ограничен видом проверок и текущим ботом. */
it('отправляет очистку только подтверждённой области', async () => {
  mocks.request.mockResolvedValue({ deleted: 2 });
  const done = vi.fn();
  render(<QueryClientProvider client={new QueryClient()}><DeleteCheckHistoryButton projectId={12} tokenId={9} kind="telegram-bots" onDeleted={done} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить историю' }));
  fireEvent.click(screen.getByRole('button', { name: 'Удалить', exact: true }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(mocks.request).toHaveBeenCalledWith('DELETE', '/api/projects/12/check-history?kind=telegram-bots&tokenId=9');
});

/** Отмена верхнего окна возвращает к открытой проверке, не закрывая родительский диалог. */
it('открывает подтверждение поверх родительского окна', async () => {
  const change = vi.fn();
  render(<QueryClientProvider client={new QueryClient()}><Dialog open onOpenChange={change}><DialogContent><DialogTitle>Проверка чатов</DialogTitle><DialogDescription>История</DialogDescription><DeleteCheckHistoryButton projectId={12} tokenId={9} kind="private-chats" onDeleted={vi.fn()} /></DialogContent></Dialog></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить историю' }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(change).not.toHaveBeenCalled();
});
