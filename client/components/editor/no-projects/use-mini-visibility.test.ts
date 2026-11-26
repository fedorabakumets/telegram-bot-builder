/** @fileoverview Проверки сохранения видимости питомца Mini и её синхронизации между экранами. */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useMiniTabVisibility, useMiniVisibility } from './use-mini-visibility';

const storageKey = 'botcraft-editor-appearance-miniVisible';

afterEach(() => {
  window.localStorage.removeItem(storageKey);
});

describe('Видимость Mini', () => {
  it('выключает Mini в редакторе по умолчанию и сохраняет выбор отдельно от других вкладок', () => {
    const editor = renderHook(() => useMiniTabVisibility('editor'));
    const bot = renderHook(() => useMiniTabVisibility('bot'));
    expect(editor.result.current[0]).toBe(false);
    expect(bot.result.current[0]).toBe(true);
    act(() => editor.result.current[1](true));
    act(() => bot.result.current[1](false));
    expect(renderHook(() => useMiniTabVisibility('editor')).result.current[0]).toBe(true);
    expect(bot.result.current[0]).toBe(false);
    window.localStorage.removeItem('botcraft-editor-appearance-miniTab-editor');
    window.localStorage.removeItem('botcraft-editor-appearance-miniTab-bot');
  });
  it('показывает питомца по умолчанию', () => {
    const { result } = renderHook(useMiniVisibility);
    expect(result.current[0]).toBe(true);
  });

  it('скрывает питомца на открытом экране и запоминает выбор при переходе', () => {
    const profile = renderHook(useMiniVisibility);
    const editor = renderHook(useMiniVisibility);

    act(() => profile.result.current[1](false));
    expect(editor.result.current[0]).toBe(false);
    expect(window.localStorage.getItem(storageKey)).toBe('false');
    editor.unmount();

    const templates = renderHook(useMiniVisibility);
    expect(templates.result.current[0]).toBe(false);
    act(() => templates.result.current[1](true));
    expect(profile.result.current[0]).toBe(true);
    expect(window.localStorage.getItem(storageKey)).toBe('true');
  });

  it('обновляет видимость после изменения настройки в соседней вкладке', () => {
    const { result } = renderHook(useMiniVisibility);
    act(() => {
      window.localStorage.setItem(storageKey, 'false');
      window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: 'false' }));
    });
    expect(result.current[0]).toBe(false);
  });
});
