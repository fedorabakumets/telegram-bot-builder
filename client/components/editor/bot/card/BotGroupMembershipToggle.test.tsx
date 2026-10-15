/** @fileoverview Тест переключателя слежения за группами. */
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { BotGroupMembershipToggle } from './BotGroupMembershipToggle';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

it('включён по умолчанию и сохраняет изменение в очередь настроек', () => {
  const pending = vi.fn();
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><BotGroupMembershipToggle projectId={9} tokenId={5}
    trackGroupMembership={1} onPendingChange={pending} /></QueryClientProvider>);
  const toggle = screen.getByRole('switch', { name: 'Отслеживать группы' });
  expect(toggle).toBeChecked();
  fireEvent.click(toggle);
  expect(pending).toHaveBeenCalledWith('TRACK_GROUP_MEMBERSHIP', '0');
});
