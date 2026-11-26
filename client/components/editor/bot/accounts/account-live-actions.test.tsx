/** @fileoverview Проверяет недоступные форматы и подтверждение переноса сессий. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AccountLiveSession } from './account-live-session';
import { AccountMigrationActions } from './account-migration-actions';

const api = vi.hoisted(() => vi.fn());
vi.mock('@/queryClient', () => ({ apiRequest: api }));
afterEach(() => vi.resetAllMocks());

const path = '/api/projects/9/telegram-accounts/migration';

it('показывает введённый номер при подтверждении кода и пароля', async () => {
  api.mockResolvedValueOnce({ stage: 'code' }).mockResolvedValueOnce({ stage: 'password' });
  render(<AccountLiveSession url="/api/projects/9/telegram-accounts/4" onSaved={vi.fn()} />);
  const phone = screen.getByLabelText('Номер телефона');
  fireEvent.change(phone, { target: { value: '+12025550142' } });
  fireEvent.submit(phone.closest('form')!);
  const code = await screen.findByLabelText('Код из Telegram');
  expect(screen.getByText('+12025550142')).toBeInTheDocument();
  fireEvent.submit(code.closest('form')!);
  await screen.findByLabelText('Пароль двухэтапной проверки');
  expect(screen.getByText('+12025550142')).toBeInTheDocument();
});
const groups = [{ id: 5, botIds: [5, 62], botNames: ['Первый', 'Второй'], disposition: 'create' as const, matchingIdentityGroupIds: [] }];

/** Открывает действия переноса с отдельным клиентом кеша. */
function renderMigration() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AccountMigrationActions path={path} actorId={100} groups={groups} onChanged={vi.fn()} />
    </QueryClientProvider>,
  );
}

it('помечает tdata как недоступный и не отправляет запрос', () => {
  render(<AccountLiveSession url="/api/projects/9/telegram-accounts/4" onSaved={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Способ подключения'), { target: { value: 'tdata' } });
  expect(screen.getByText(/Импорт tdata пока недоступен/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Импортировать' })).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

it('не предлагает перенос, если локальная среда его не подтверждает', async () => {
  api.mockResolvedValue({ canApply: false, operations: [] });
  renderMigration();
  expect(await screen.findByText(/Перенос недоступен в текущей среде/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Перенести группу/ })).not.toBeInTheDocument();
});

it('объясняет отсутствие воркера и обновляет доступность по запросу', async () => {
  api.mockResolvedValueOnce({ canApply: false, availabilityReason: 'worker-unavailable', operations: [] })
    .mockResolvedValueOnce({ canApply: true, operations: [] });
  renderMigration();
  expect(await screen.findByText(/не видит локальный воркер проекта/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Проверить снова' }));
  expect(await screen.findByRole('button', { name: 'Перенести группу #5' })).toBeInTheDocument();
});

it('отправляет перенос только после подтверждения и сохраняет ключ при повторе', async () => {
  const failure = new Error('Воркер не подтвердил остановку');
  api.mockImplementation((method: string) => method === 'POST'
    ? Promise.reject(failure) : Promise.resolve({ canApply: true, operations: [] }));
  renderMigration();
  fireEvent.click(await screen.findByRole('button', { name: 'Перенести группу #5' }));
  expect(api.mock.calls.every(([method]) => method !== 'POST')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить перенос' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(failure.message);
  const retry = await screen.findByRole('button', { name: 'Подтвердить перенос' });
  fireEvent.click(retry);
  const calls = api.mock.calls.filter(([method]) => method === 'POST');
  expect(calls).toHaveLength(2);
  expect(calls[0][2]).toEqual({ migrationId: expect.any(String), groupId: 5 });
  expect(calls[1][2]).toEqual(calls[0][2]);
});
