/** @fileoverview Проверки переключения вкладок и восстановления панелей редактора. */
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useTabNavigation } from './use-tab-navigation';
import type { EditorTab } from '../types';

it('игнорирует повторный выбор и меняет видимость кода только при переходах', () => {
  const setCurrentTab = vi.fn();
  const setPreviousTab = vi.fn();
  const onOpenCodePanel = vi.fn();
  const onCloseCodePanel = vi.fn();
  const onRestoreCanvas = vi.fn();
  const { result, rerender } = renderHook(
    ({ currentTab }: { /** Открытая вкладка. */ currentTab: EditorTab }) =>
      useTabNavigation({ currentTab, setCurrentTab, setPreviousTab, onOpenCodePanel, onCloseCodePanel, onRestoreCanvas }),
    { initialProps: { currentTab: 'editor' } },
  );
  act(() => result.current.handleTabChange('editor'));
  expect(setCurrentTab).not.toHaveBeenCalled();
  expect(onCloseCodePanel).not.toHaveBeenCalled();

  act(() => result.current.handleTabChange('export'));
  expect(setCurrentTab).toHaveBeenLastCalledWith('export');
  expect(onOpenCodePanel).toHaveBeenCalledOnce();

  rerender({ currentTab: 'export' });
  act(() => result.current.handleTabChange('versions'));
  expect(setCurrentTab).toHaveBeenLastCalledWith('versions');
  expect(onCloseCodePanel).toHaveBeenCalledOnce();
  expect(onRestoreCanvas).toHaveBeenCalledOnce();
});
