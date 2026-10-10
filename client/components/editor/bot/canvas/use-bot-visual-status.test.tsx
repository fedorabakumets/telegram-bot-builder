/**
 * @fileoverview Проверки подтверждения статуса и независимости операций разных ботов.
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBotVisualStatus } from './use-bot-visual-status';

const context = vi.hoisted(() => ({
  startBotMutation: { isPending: false, isError: false, submittedAt: 2, variables: { tokenId: 301, projectId: 289 } },
  stopBotMutation: { isPending: false, isError: false, submittedAt: 1, variables: { tokenId: 301, projectId: 289 } },
  restartAllBotsMutation: { isPending: false, variables: 289 },
  startOfflineAllMutation: { isPending: false, variables: 289 },
  allBotStatuses: [],
}));
vi.mock('../bot-control-context', () => ({ useBotControl: () => context }));
vi.mock('@tanstack/react-query', () => ({ useIsMutating: () => 0 }));

beforeEach(() => {
  vi.useFakeTimers();
  context.startBotMutation.isPending = false;
  context.startBotMutation.isError = false;
  context.stopBotMutation.isPending = false;
  context.stopBotMutation.isError = false;
  context.startBotMutation.submittedAt = 2;
  context.stopBotMutation.submittedAt = 1;
  context.restartAllBotsMutation.isPending = false;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('визуальный статус процесса', () => {
  it('ожидает подтверждение после запроса запуска и только затем показывает онлайн', () => {
    const hook = renderHook(({ running }) => useBotVisualStatus(301, 289, 1, running),
      { initialProps: { running: false } });
    context.startBotMutation.isPending = true;
    hook.rerender({ running: false });
    expect(hook.result.current).toBe('starting');
    context.startBotMutation.isPending = false;
    hook.rerender({ running: false });
    expect(hook.result.current).toBe('starting');
    hook.rerender({ running: true });
    expect(hook.result.current).toBe('online');
  });
  it('анимирует остановку до подтверждения отсутствия процесса', () => {
    context.stopBotMutation.isPending = true;
    const hook = renderHook(({ running }) => useBotVisualStatus(301, 289, 1, running),
      { initialProps: { running: true } });
    expect(hook.result.current).toBe('stopping');
    context.stopBotMutation.isPending = false;
    hook.rerender({ running: true });
    expect(hook.result.current).toBe('stopping');
    hook.rerender({ running: false });
    expect(hook.result.current).toBe('offline');
  });
  it('не переносит операцию на другой токен или проект', () => {
    context.startBotMutation.isPending = true;
    const other = renderHook(() => useBotVisualStatus(294, 289, 1, false));
    const otherProject = renderHook(() => useBotVisualStatus(301, 287, 1, false));
    expect(other.result.current).toBe('offline');
    expect(otherProject.result.current).toBe('offline');
    context.restartAllBotsMutation.isPending = true;
    other.rerender();
    otherProject.rerender();
    expect(other.result.current).toBe('restarting');
    expect(otherProject.result.current).toBe('offline');
  });
  it('показывает ошибку запроса запуска без ложного онлайн', () => {
    context.startBotMutation.isPending = true;
    const hook = renderHook(() => useBotVisualStatus(301, 289, 1, false));
    context.startBotMutation.isPending = false;
    context.startBotMutation.isError = true;
    hook.rerender();
    expect(hook.result.current).toBe('error');
  });
  it('показывает ошибку остановки, сохраняя подтверждённое состояние процесса', () => {
    context.stopBotMutation.submittedAt = 3;
    context.stopBotMutation.isPending = true;
    const hook = renderHook(() => useBotVisualStatus(301, 289, 1, true));
    context.stopBotMutation.isPending = false;
    context.stopBotMutation.isError = true;
    hook.rerender();
    expect(hook.result.current).toBe('error');
  });
  it('при задержке обновления возвращает исходный статус вместо бесконечной анимации', () => {
    context.startBotMutation.isPending = true;
    const hook = renderHook(() => useBotVisualStatus(301, 289, 1, false));
    context.startBotMutation.isPending = false;
    hook.rerender();
    act(() => vi.advanceTimersByTime(15000));
    expect(hook.result.current).toBe('offline');
  });
});
