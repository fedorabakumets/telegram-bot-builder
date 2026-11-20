/** @fileoverview Проверки понятной пометки групповой истории и сохранения перехода к диалогу. */
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { UserBotData } from '@shared/schema';
import { UserIdentity } from './user-summary';
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
/** Пометка не заменяет имя и не перехватывает переход к переписке. */
it('показывает групповую историю с датой и сохраняет переход по имени', () => {
  const open = vi.fn();
  const user = { userId: '100', firstName: 'Анна', contactOrigin: 'group_history', firstSavedMessageAt: '2026-10-19T12:00:00Z' } as UserBotData;
  const view = render(<UserIdentity user={user} onOpenDialog={open} />);
  expect(screen.getByText('Из групповой истории')).toBeTruthy();
  expect(screen.getByText(/Первое сообщение:/).textContent).toContain('19');
  fireEvent.click(screen.getByRole('button', { name: 'Открыть диалог с Анна' }));
  expect(open).toHaveBeenCalledOnce();
  view.rerender(<UserIdentity user={{ ...user, contactOrigin: 'private' }} onOpenDialog={open} />);
  expect(screen.queryByText('Из групповой истории')).toBeNull();
});
