/** @fileoverview Проверяет позднюю загрузку Telegram Mini App и доступность обычного входа. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMiniAppAuth } from './use-mini-app-auth';

const { acceptSession } = vi.hoisted(() => ({ acceptSession: vi.fn() }));
vi.mock('./use-telegram-auth', () => ({ useTelegramAuth: () => ({ acceptSession, isLoading: false }) }));

afterEach(() => { document.getElementById('telegram-mini-app-api')?.remove(); delete window.Telegram; vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('не запускает авторизацию, если Telegram недоступен', () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  const script = document.createElement('script'); script.id = 'telegram-mini-app-api'; document.head.append(script);
  renderHook(() => useMiniAppAuth());
  act(() => script.dispatchEvent(new Event('error')));
  expect(fetchMock).not.toHaveBeenCalled();
});

it('авторизует после поздней загрузки Telegram API', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ success: true, user: { id: 42 } }) });
  vi.stubGlobal('fetch', fetchMock);
  const script = document.createElement('script'); script.id = 'telegram-mini-app-api'; document.head.append(script);
  renderHook(() => useMiniAppAuth());
  const ready = vi.fn(); window.Telegram = { WebApp: { initData: 'signed-data', initDataUnsafe: { user: { id: 42, first_name: 'Тест' } }, ready } };
  act(() => script.dispatchEvent(new Event('load')));
  await waitFor(() => expect(acceptSession).toHaveBeenCalledWith({ id: 42 }, false));
  expect(ready).toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledWith('/api/auth/telegram/miniapp', expect.objectContaining({ body: JSON.stringify({ initData: 'signed-data' }) }));
});
