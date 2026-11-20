/** @fileoverview Проверяет запасную навигацию и компактное меню помощи в шапке редактора. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdaptiveHeader } from './adaptive-header';
import type { AdaptiveHeaderProps } from './types';

vi.mock('./hooks/use-telegram-auth', () => ({
  useTelegramAuth: () => ({ user: null, logout: vi.fn(), isLoading: false, isTelegramUser: () => false }),
}));
vi.mock('./hooks/use-telegram-login', () => ({ useTelegramLogin: () => ({ handleTelegramLogin: vi.fn() }) }));
vi.mock('./hooks/use-telegram-auth-listener', () => ({ useTelegramAuthListener: vi.fn() }));
vi.mock('@/components/editor/setup/hooks/use-setup', () => ({ useSetupBootstrap: () => ({ data: undefined }) }));

/** Минимальный горизонтальный макет для переключения между вариантами навигации. */
const props: AdaptiveHeaderProps = {
  config: { headerPosition: 'top', compactMode: true } as AdaptiveHeaderProps['config'],
  projectName: 'Казино', currentTab: 'editor', onTabChange: vi.fn(), onExport: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    /** Подключает заглушку к элементу. */
    observe() {}
    /** Отключает заглушку. */
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('обходит основную навигацию только если боковой панели нет', async () => {
  const onTabChange = vi.fn();
  const { rerender } = render(<AdaptiveHeader {...props} onTabChange={onTabChange} hasWorkspaceSidebar />);
  expect(screen.queryByRole('button', { name: 'Меню' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'Редактор' })).toBeTruthy();

  rerender(<AdaptiveHeader {...props} onTabChange={onTabChange} />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Меню' }), { key: 'Enter' });
  expect((await screen.findByRole('menuitem', { name: 'Редактор' })).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('menuitem', { name: 'Бот' }));
  expect(onTabChange).toHaveBeenCalledWith('bot');
});

it('сохраняет обучение и внешние ссылки внутри компактной помощи', async () => {
  render(<AdaptiveHeader {...props} hasWorkspaceSidebar />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Помощь' }), { key: 'Enter' });
  expect(await screen.findByRole('menuitem', { name: 'Обучение' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'GitHub' })).toHaveProperty('target', '_blank');
  expect(screen.getByRole('menuitem', { name: 'Telegram' })).toHaveProperty('target', '_blank');
});
