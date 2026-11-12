/** @fileoverview Изоляция черновиков и завершения сохранения между карточками ботов. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEnvPendingChanges } from './use-env-pending-changes';

const mocks = vi.hoisted(() => ({ request: vi.fn(), invalidate: vi.fn(), toast: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('./use-bot-env-restart', () => ({ useBotEnvRestart: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('./use-userbot-pending-sync', () => ({ useUserbotPendingSync: () => {} }));

describe('изоляция несохранённых настроек', () => {
  it('очищает выбор при переходе к другому боту', () => {
    const hook = renderHook(({ token }) => useEnvPendingChanges(40, token), { initialProps: { token: 31 } });
    act(() => hook.result.current.addChange({ action: 'update', type: 'system', key: 'BOT_POLLING_MODE', value: 'process' }));
    expect(hook.result.current.changesCount).toBe(1);
    hook.rerender({ token: 32 });
    expect(hook.result.current.changesCount).toBe(0);
  });

  it('завершение сохранения старого бота не стирает новый черновик', async () => {
    let finish!: () => void;
    mocks.request.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    const hook = renderHook(({ token }) => useEnvPendingChanges(40, token), { initialProps: { token: 31 } });
    act(() => hook.result.current.addChange({ action: 'update', type: 'system', key: 'BOT_POLLING_MODE', value: 'process' }));
    let saved!: Promise<void>;
    act(() => { saved = hook.result.current.saveAll(); });
    hook.rerender({ token: 32 });
    act(() => hook.result.current.addChange({ action: 'update', type: 'system', key: 'BOT_POLLING_MODE', value: 'direct' }));
    await act(async () => { finish(); await saved; });
    expect(hook.result.current.getPendingValue('BOT_POLLING_MODE')).toBe('direct');
    expect(hook.result.current.isSaving).toBe(false);
  });
});
