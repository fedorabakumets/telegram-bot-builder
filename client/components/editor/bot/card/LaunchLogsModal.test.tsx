/** @fileoverview Проверка ошибок и повторной загрузки настоящего модального окна истории запуска. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { LaunchLogsModal } from './LaunchLogsModal';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const rows = [{ id: 17, type: 'stdout', content: 'Сохранённая строка запуска', timestamp: '2026-11-23T15:57:00Z' }];

/** Возвращает независимый кэш для повторного запроса из теста. */
function showModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><LaunchLogsModal launchId={8970}
    startedAt="2026-11-23T15:57:00Z" isOpen onClose={() => {}} /></QueryClientProvider>);
  return client;
}

it('показывает ошибку вместо пустого состояния и загружает строки после повтора', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => rows }));
  showModal();
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Не удалось загрузить логи запуска.'));
  expect(screen.queryByText('Логи не сохранены')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
  expect(await screen.findByText('Сохранённая строка запуска')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('не скрывает сохранённые строки при ошибке обновления', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => rows })
    .mockRejectedValueOnce(new Error('Нет связи')));
  const client = showModal();
  expect(await screen.findByText('Сохранённая строка запуска')).toBeTruthy();
  await act(async () => { await client.invalidateQueries({ queryKey: ['launch-logs', 8970] }); });
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Показаны ранее загруженные строки.'));
  expect(screen.getByText('Сохранённая строка запуска')).toBeTruthy();
  expect(screen.queryByText('Логи не сохранены')).toBeNull();
});

it('показывает пустое состояние после успешного ответа без строк', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  showModal();
  expect(await screen.findByText('Логи не сохранены')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
