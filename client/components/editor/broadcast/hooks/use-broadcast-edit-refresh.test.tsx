/** @fileoverview Проверка обновления ленты рассылок после внешней правки текста. */
import { renderHook, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useBroadcastEditRefresh } from './use-broadcast-edit-refresh';

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), listener: undefined as undefined | ((event: any) => void), unsubscribe: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('@/components/editor/database/user-database/contexts/user-messages-live-context', () => ({
  useUserMessagesLiveContext: () => ({ subscribe: (listener: any) => { mocks.listener = listener; return mocks.unsubscribe; } }),
}));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it('объединяет правки и обновляет только рассылки выбранного проекта', () => {
  vi.useFakeTimers();
  const hook = renderHook(() => useBroadcastEditRefresh(13));
  act(() => {
    mocks.listener?.({ type: 'message-edited', projectId: 12 });
    vi.advanceTimersByTime(600);
  });
  expect(mocks.invalidate).not.toHaveBeenCalled();
  act(() => {
    mocks.listener?.({ type: 'message-edited', projectId: 13 });
    vi.advanceTimersByTime(300);
    mocks.listener?.({ type: 'message-edited', projectId: 13 });
    vi.advanceTimersByTime(500);
  });
  expect(mocks.invalidate).toHaveBeenCalledTimes(1);
  const predicate = mocks.invalidate.mock.calls[0][0].predicate;
  expect(predicate({ queryKey: ['/api/projects/13/broadcasts?page=1'] })).toBe(true);
  expect(predicate({ queryKey: ['/api/projects/13/broadcast-campaigns'] })).toBe(true);
  expect(predicate({ queryKey: ['/api/projects/12/broadcasts?page=1'] })).toBe(false);
  expect(predicate({ queryKey: ['/api/projects/13/users'] })).toBe(false);
  hook.unmount();
  expect(mocks.unsubscribe).toHaveBeenCalled();
});
