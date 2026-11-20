/** @fileoverview Проверки переключателя вкладки и локального прототипа Telegram-аккаунтов. */
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountSessionImport } from './account-session-import';
import { BotWorkspaceModeSwitch } from './BotWorkspaceModeSwitch';
import { useMockTelegramAccounts } from './use-mock-telegram-accounts';

afterEach(cleanup);

describe('Переключение между ботами и аккаунтами', () => {
  it('отмечает текущий раздел и даёт выбрать другой', () => {
    const onModeChange = vi.fn();
    const view = render(<BotWorkspaceModeSwitch mode="bots" onModeChange={onModeChange} />);
    const bots = screen.getByRole('button', { name: 'Боты' });
    const accounts = screen.getByRole('button', { name: 'Аккаунты' });

    expect(bots.getAttribute('aria-pressed')).toBe('true');
    expect(accounts.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(bots);
    expect(onModeChange).not.toHaveBeenCalled();
    fireEvent.click(accounts);
    expect(onModeChange).toHaveBeenCalledExactlyOnceWith('accounts');

    view.rerender(<BotWorkspaceModeSwitch mode="accounts" onModeChange={onModeChange} />);
    expect(accounts.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Демонстрационные Telegram-аккаунты', () => {
  it('импортирует образец выбранного типа без запроса файла или секрета', () => {
    const onImport = vi.fn();
    const { container } = render(<AccountSessionImport currentMethod="session-json" onImport={onImport} />);

    expect(screen.getByText('demo.session и demo.json')).toBeDefined();
    expect(container.querySelector('input[type="file"], input[type="password"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Импортировать пример' }));
    expect(onImport).toHaveBeenCalledExactlyOnceWith('session-json');
  });

  it('привязывает два бота к аккаунту и отвязывает только выбранного', () => {
    const { result } = renderHook(() => useMockTelegramAccounts(9));
    const [firstBot, secondBot] = result.current.bots;
    const account = result.current.accounts.find(item =>
      item.botIds.includes(firstBot.id) && item.botIds.includes(secondBot.id),
    )!;

    act(() => result.current.selectAccount(account.id));
    act(() => result.current.toggleBot(account.id, firstBot.id));
    expect(result.current.selectedAccount?.botIds).not.toContain(firstBot.id);
    expect(result.current.selectedAccount?.botIds).toContain(secondBot.id);

    act(() => result.current.toggleBot(account.id, firstBot.id));
    expect(result.current.selectedAccount?.botIds).toEqual(expect.arrayContaining([firstBot.id, secondBot.id]));
  });

  it('переносит только выбранного бота с прежнего аккаунта', () => {
    const { result } = renderHook(() => useMockTelegramAccounts(9));
    const [firstBot, secondBot] = result.current.bots;
    const source = result.current.accounts.find(item => item.botIds.includes(firstBot.id))!;
    act(() => result.current.createAccount());
    const target = result.current.selectedAccount!;

    act(() => result.current.toggleBot(target.id, firstBot.id));
    expect(result.current.selectedAccount?.botIds).toEqual([firstBot.id]);
    expect(result.current.accounts.find(item => item.id === source.id)?.botIds).toEqual([secondBot.id]);
  });

  it('фиксирует только тип демонстрационной сессии и настройки прокси', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    try {
      const { result } = renderHook(() => useMockTelegramAccounts(9));
      act(() => result.current.createAccount());
      const account = result.current.selectedAccount!;
      const proxy = {
        enabled: true, type: 'socks5', host: 'proxy.example.test', port: '1080', status: 'success',
      } as const;

      act(() => result.current.importSession(account.id, 'session-json'));
      act(() => result.current.updateProxy(account.id, proxy));

      expect(result.current.selectedAccount?.sessionKind).toBe('session-json');
      expect(result.current.selectedAccount?.status).toBe('connected');
      expect(result.current.selectedAccount?.proxy).toEqual(proxy);
      expect(request).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('сохраняет независимое состояние у разных проектов', () => {
    const { result, rerender } = renderHook(({ projectId }) => useMockTelegramAccounts(projectId), {
      initialProps: { projectId: 9 },
    });
    const initialCount = result.current.accounts.length;

    act(() => result.current.createAccount());
    expect(result.current.accounts).toHaveLength(initialCount + 1);
    expect(result.current.selectedAccount).not.toBeNull();

    rerender({ projectId: 10 });
    expect(result.current.accounts).toHaveLength(initialCount);
    rerender({ projectId: 9 });
    expect(result.current.accounts).toHaveLength(initialCount + 1);
  });
});
