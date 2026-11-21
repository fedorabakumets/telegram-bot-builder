/** @fileoverview Проверки отмены и автоматического восстановления ожидания памяти. */
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  current: {} as Record<string, unknown>, allowed: true, shutdown: false,
  start: vi.fn(async () => ({ success: true })),
  token: { token: 'secret', isActive: 1, authorizationError: null },
}));
vi.mock('../storages/storage', () => ({ storage: {
  getBotInstanceByToken: async () => state.current,
  getBotToken: async () => state.token,
} }));
vi.mock('./startBot', () => ({ startBot: state.start }));
vi.mock('./automaticBotStartAllowed', () => ({ automaticBotStartAllowed: async () => state.allowed }));
vi.mock('./serverShutdownState', () => ({ isServerShuttingDown: () => state.shutdown }));

/** Снимок ожидающего бота текущего поколения. */
function waiter() {
  return { tokenId: 45, projectId: 12, desiredGeneration: 2, desiredStatus: 'running',
    status: 'error', errorMessage: '[runner_memory] Недостаточно памяти' };
}
beforeEach(() => {
  vi.resetModules();
  state.current = waiter(); state.allowed = true; state.shutdown = false;
  state.start.mockClear();
});

it('ожидающий бот автоматически проходит через настоящий startBot с допуском runner', async () => {
  const { recoverMemoryWaiters } = await import('./recoverMemoryWaiters');
  await recoverMemoryWaiters([waiter()] as never, new Set(), () => true);
  expect(state.start).toHaveBeenCalledTimes(1);
});

it.each(['stopped', 'new-generation', 'frozen', 'shutdown', 'occupied', 'no-runner'])
  ('устаревшее ожидание не запускается: %s', async condition => {
    if (condition === 'stopped') state.current.desiredStatus = 'stopped';
    if (condition === 'new-generation') state.current.desiredGeneration = 3;
    if (condition === 'frozen') state.allowed = false;
    if (condition === 'shutdown') state.shutdown = true;
    const { recoverMemoryWaiters } = await import('./recoverMemoryWaiters');
    await recoverMemoryWaiters([waiter()] as never,
      new Set(condition === 'occupied' ? [45] : []), () => condition !== 'no-runner');
    expect(state.start).not.toHaveBeenCalled();
  });
