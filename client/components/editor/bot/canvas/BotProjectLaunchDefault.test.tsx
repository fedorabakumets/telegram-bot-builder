/** @fileoverview Проверка явного сохранения общего режима получения обновлений. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BotProjectLaunchDefault } from './BotProjectLaunchDefault';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), reset: vi.fn() }));
vi.mock('./use-bot-project-launch-default', () => ({
  useBotProjectLaunchDefault: () => ({
    data: { launchMode: 'polling', inheritedCount: 99, overrideCount: 1 },
  }),
  useSaveBotProjectLaunchDefault: () => mocks,
}));

afterEach(cleanup);

it('сохраняет режим только после нажатия кнопки', () => {
  render(<BotProjectLaunchDefault projectId={10} />);
  const button = screen.getByRole('button', { name: 'Сохранить режим' });
  expect(button).toHaveProperty('disabled', true);

  fireEvent.click(screen.getByRole('radio', { name: 'Webhook' }));
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(button).toHaveProperty('disabled', false);

  fireEvent.click(button);
  expect(mocks.mutate).toHaveBeenCalledWith('webhook', expect.objectContaining({ onSuccess: expect.any(Function) }));
});
