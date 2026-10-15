/** @fileoverview Тест переключателя автоматического отслеживания блокировок. */
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { BotBlockTrackingToggle } from './BotBlockTrackingToggle';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

it('включён по умолчанию и сохраняет изменение в очередь настроек', () => {
  const pending = vi.fn();
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><BotBlockTrackingToggle projectId={9} tokenId={5}
    trackUserBlocks={1} onPendingChange={pending} /></QueryClientProvider>);
  const toggle = screen.getByRole('switch', { name: 'Отслеживать блокировки' });
  expect(toggle).toBeChecked();
  fireEvent.click(toggle);
  expect(pending).toHaveBeenCalledWith('TRACK_USER_BLOCKS', '0');
});
