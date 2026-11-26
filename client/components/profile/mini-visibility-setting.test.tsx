/** @fileoverview Проверка перехода из меню Mini к его настройке в открытом профиле. */
import { fireEvent, render, screen } from '@testing-library/react';
import { navigate } from 'wouter/use-browser-location';
import { expect, it, vi } from 'vitest';
import { MiniVisibilitySetting } from './mini-visibility-setting';
import { miniTabs } from '@/components/editor/no-projects/use-mini-visibility';

/** Проверяет включение после общего и выборочного скрытия. */
it('управляет всеми вкладками и учитывает выборочное скрытие', () => {
  const prefix = 'botcraft-editor-appearance-';
  localStorage.setItem(prefix + 'miniVisible', 'false');
  localStorage.setItem(prefix + 'miniTab-bot', 'false');
  try {
    render(<MiniVisibilitySetting />);
    const toggle = screen.getByRole('switch', { name: 'Показывать на всех вкладках' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    for (const [tab] of miniTabs) expect(localStorage.getItem(prefix + 'miniTab-' + tab)).toBe('true');
    fireEvent.click(screen.getByRole('switch', { name: 'Показывать на этой вкладке' }));
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(localStorage.getItem(prefix + 'miniVisible')).toBe('false');
  } finally {
    localStorage.removeItem(prefix + 'miniVisible');
    for (const [tab] of miniTabs) localStorage.removeItem(prefix + 'miniTab-' + tab);
  }
});

it('фокусирует переключатель по ссылке при открытии и при повторной навигации', () => {
  const previousUrl = window.location.href;
  const originalScroll = HTMLElement.prototype.scrollIntoView;
  const scrollIntoView = vi.fn();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  try {
    const profile = '/profile?section=interface';
    navigate(profile + '#mini-settings');
    render(<MiniVisibilitySetting />);
    const toggle = screen.getByRole('switch', { name: 'Показывать на всех вкладках' });
    expect(document.activeElement).toBe(toggle);

    navigate(profile);
    toggle.blur();
    navigate(profile + '#mini-settings');
    expect(document.activeElement).toBe(toggle);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  } finally {
    HTMLElement.prototype.scrollIntoView = originalScroll;
    navigate(previousUrl, { replace: true });
  }
});
