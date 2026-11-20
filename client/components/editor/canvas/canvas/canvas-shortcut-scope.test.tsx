/** @fileoverview Проверяет область действия клавиш холста при открытии и закрытии истории. */
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hasCanvasShortcutBlocker } from './canvas-shortcut-scope';
import { VersionHistoryButton } from './version-history-button';

afterEach(() => { cleanup(); document.body.replaceChildren(); });

/** Настоящий поповер ставит ограничитель только на время работы с историей. */
it('ограничивает горячие клавиши при открытии истории с тулбара', () => {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><VersionHistoryButton projectId={10} /></QueryClientProvider>);
  const history = screen.getByRole('button', { name: 'История версий' });

  expect(hasCanvasShortcutBlocker(document)).toBe(false);
  fireEvent.click(history);
  expect(screen.getByRole('textbox', { name: 'Название чекпоинта' })).toBeInTheDocument();
  expect(hasCanvasShortcutBlocker(document)).toBe(true);
  fireEvent.click(history);
  expect(hasCanvasShortcutBlocker(document)).toBe(false);
});

/** Портал блокирует клавиши холста и с внешним фокусом. */
it('приостанавливает команды на время открытой истории и возвращает их после закрытия', () => {
  const editor = document.body.appendChild(document.createElement('input'));
  editor.focus();
  expect(hasCanvasShortcutBlocker(document)).toBe(false);

  const portal = document.body.appendChild(document.createElement('section'));
  portal.setAttribute('data-block-canvas-shortcuts', '');
  portal.dataset.state = 'open';
  expect(document.activeElement).toBe(editor);
  expect(hasCanvasShortcutBlocker(document)).toBe(true);

  portal.dataset.state = 'closed';
  expect(hasCanvasShortcutBlocker(document)).toBe(false);
});

/** Отдельная панель сравнения может ограничить ввод без собственного состояния Radix. */
it('приостанавливает команды на время сравнения, сохраняя обычные диалоги', () => {
  const dialog = document.body.appendChild(document.createElement('div'));
  dialog.setAttribute('role', 'dialog');
  expect(hasCanvasShortcutBlocker(document)).toBe(false);
  dialog.setAttribute('data-block-canvas-shortcuts', '');
  expect(hasCanvasShortcutBlocker(document)).toBe(true);
  dialog.remove();
  expect(hasCanvasShortcutBlocker(document)).toBe(false);
});
