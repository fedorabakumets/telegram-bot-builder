/** @fileoverview Проверка результата удаления бота в диалоге подтверждения. */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
import { DeleteBotConfirmDialog } from './DeleteBotConfirmDialog';

vi.mock('./card/BotAvatar', () => ({ BotAvatar: () => null }));
vi.mock('@/components/editor/database/user-database/components/header/use-token-user-counts', () => ({
  useTokenUserCounts: () => new Map(),
}));

it('оставляет диалог открытым и показывает причину отказа сервера', async () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn().mockRejectedValue(new Error('Остановка не подтверждена; токен не удалён'));
  const token = { id: 40, name: 'AWS_bot' } as BotToken;
  render(<DeleteBotConfirmDialog open onOpenChange={onOpenChange} token={token} projectId={12}
    isRunning pending={false} onConfirm={onConfirm} />);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить бота' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Остановка не подтверждена; токен не удалён');
  expect(onOpenChange).not.toHaveBeenCalledWith(false);
});
