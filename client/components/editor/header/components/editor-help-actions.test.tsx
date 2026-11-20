/** @fileoverview Проверка ссылок, запуска обучения и входа в поддержку из меню шапки. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { registerEditorLearn } from '@/components/editor/canvas/learn/editor-learn-bridge';
import { SupportChatButton } from '@/components/support/support-chat-button';
import { EditorHelpActions } from './editor-help-actions';

/** Отслеживает открытие существующего чата без подключения сети. */
const support = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock('@/components/support/support-chat-button', () => ({
  SupportChatButton: ({ renderTrigger }: ComponentProps<typeof SupportChatButton>) => renderTrigger?.(support.open, 2),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

/** Гостю доступны ссылки группы помощи. */
it('показывает одну кнопку помощи в компактном режиме и ведёт на существующие страницы', () => {
  render(<EditorHelpActions compact showLearning={false} canUseSupport={false} />);
  const trigger = screen.getByRole('button', { name: 'Помощь' });
  expect(screen.queryByRole('button', { name: 'Ещё' })).toBeNull();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  expect(screen.getByRole('menuitem', { name: 'GitHub' }).getAttribute('href'))
    .toBe('https://github.com/fedorabakumets/telegram-bot-builder');
  expect(screen.getByRole('menuitem', { name: 'Telegram' }).getAttribute('href')).toBe('https://t.me/bot_builder_chat');
  expect(screen.queryByRole('menuitem', { name: 'Поддержка' })).toBeNull();
});

/** Сохраняет существующие обработчики обучения и чата. */
it('запускает урок и открывает поддержку из компактного меню', () => {
  const start = vi.fn();
  const unregister = registerEditorLearn(start);
  try {
    render(<EditorHelpActions compact showLearning canUseSupport />);
    const trigger = screen.getByRole('button', { name: /Помощь/ });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const learning = screen.getByRole('menuitem', { name: 'Обучение' });
    fireEvent.keyDown(learning, { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('menuitem', { name: /Основы/ }));
    expect(start).toHaveBeenCalledWith('basics');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Поддержка' }));
    expect(support.open).toHaveBeenCalledOnce();
    expect(support.open).toHaveBeenCalledWith(trigger);
  } finally {
    unregister();
  }
});
