/** @fileoverview Проверки переходов загрузки, ошибки и первоначальной настройки платформы. */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { openAdminSetup } from './setup-admin-navigation';
import { SetupGuard } from './SetupGuard';
import type { SetupBootstrap } from './hooks/use-setup';

vi.mock('@/components/editor/auth', () => ({
  AuthGuard: ({ children }: { /** Содержимое после авторизации. */ children: ReactNode }) => <>{children}</>,
}));
vi.mock('./setup-admin-navigation', async (importOriginal) => ({
  ...await importOriginal<typeof import('./setup-admin-navigation')>(),
  openAdminSetup: vi.fn(),
}));

/** Отдаёт JSON-ответ bootstrap с нужным HTTP-статусом. */
function response(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Монтирует защиту с изолированным состоянием настоящего клиента запросов.
 * @param cached - Устаревший снимок состояния для проверки фонового запроса.
 * @returns Клиент запросов с состоянием страницы.
 */
function renderGuard(cached?: SetupBootstrap) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  if (cached) queryClient.setQueryData(['/api/setup/bootstrap'], cached, { updatedAt: 1 });
  render(<QueryClientProvider client={queryClient}><SetupGuard>Редактор открыт</SetupGuard></QueryClientProvider>);
  return queryClient;
}

beforeEach(() => { vi.mocked(fetch).mockReset(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

/** Пока сервер не ответил, нельзя показывать инструкцию первого запуска или контент. */
it('ждёт подтверждения состояния платформы', () => {
  vi.mocked(fetch).mockImplementationOnce((_url, options) => new Promise<Response>((_, reject) => {
    options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
  }));
  renderGuard();
  expect(screen.getByText('Проверяем состояние платформы…')).toBeInTheDocument();
  expect(screen.queryByText('Редактор открыт')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Платформа не настроена' })).not.toBeInTheDocument();
  expect(openAdminSetup).not.toHaveBeenCalled();
});

/** Блокировка появляется только после однозначного ответа о незавершённой настройке. */
it('показывает блокировку при подтверждённом отсутствии настройки и доступа к админке', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(response({ configured: false, adminEnabled: false }));
  renderGuard();
  expect(await screen.findByRole('heading', { name: 'Платформа не настроена' })).toBeInTheDocument();
  expect(screen.queryByText('Редактор открыт')).not.toBeInTheDocument();
  expect(openAdminSetup).not.toHaveBeenCalled();
});

/** Ошибка API не подменяет ответ о том, что платформа не настроена. */
it('показывает ошибку проверки и предлагает повторить запрос', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(response({ message: 'Нет доступа' }, 403));
  renderGuard();
  expect(await screen.findByRole('heading', { name: 'Не удалось проверить состояние платформы' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Повторить проверку' })).toBeEnabled();
  expect(screen.queryByRole('heading', { name: 'Платформа не настроена' })).not.toBeInTheDocument();
  expect(screen.queryByText('Редактор открыт')).not.toBeInTheDocument();
  expect(openAdminSetup).not.toHaveBeenCalled();
});

/** Один ручной повтор оставляет кнопку доступной для фокуса и восстанавливает редактор. */
it('после успешного повтора пропускает пользователя к редактору', async () => {
  let completeRetry: (value: Response) => void = () => {};
  vi.mocked(fetch)
    .mockResolvedValueOnce(response({ message: 'Нет доступа' }, 403))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { completeRetry = resolve; }));
  renderGuard();
  const button = await screen.findByRole('button', { name: 'Повторить проверку' });
  button.focus();
  fireEvent.click(button);
  await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));
  expect(button).toHaveFocus();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(fetch).toHaveBeenCalledTimes(2);
  await act(async () => completeRetry(response({ configured: true, adminEnabled: true })));
  expect(await screen.findByText('Редактор открыт')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Повторить проверку' })).not.toBeInTheDocument();
  expect(openAdminSetup).not.toHaveBeenCalled();
});

/** При доступной админке остаётся ссылка на случай, если автоматический переход задержится. */
it('открывает админку при подтверждённой необходимости настройки', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(response({ configured: false, adminEnabled: true }));
  renderGuard();
  expect(await screen.findByText('Открываем панель настройки…')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Открыть панель настройки' })).toHaveAttribute('href', '/admin/login?setup=1');
  expect(openAdminSetup).toHaveBeenCalledOnce();
  expect(screen.queryByRole('heading', { name: 'Платформа не настроена' })).not.toBeInTheDocument();
  expect(screen.queryByText('Редактор открыт')).not.toBeInTheDocument();
});

/** Неактуальный снимок не должен отправить в админку после отказа проверки. */
it('показывает ошибку вместо редиректа после неудачного обновления статуса', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(response({ message: 'Нет доступа' }, 403));
  renderGuard({ configured: false, adminEnabled: true });
  expect(screen.getByText('Проверяем состояние платформы…')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось проверить состояние платформы');
  expect(openAdminSetup).not.toHaveBeenCalled();
});

/** Разовый сбой фоновой проверки сохраняет уже подтверждённый доступ к редактору. */
it('оставляет редактор открытым при фоновой ошибке после подтверждённой настройки', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(response({ message: 'Нет доступа' }, 403));
  const client = renderGuard({ configured: true, adminEnabled: true });
  await waitFor(() => expect(client.getQueryState(['/api/setup/bootstrap'])?.status).toBe('error'));
  expect(screen.getByText('Редактор открыт')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(openAdminSetup).not.toHaveBeenCalled();
});
