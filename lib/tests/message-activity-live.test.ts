/** @fileoverview Проверки итогов периода, области событий и восстановления аналитики после разрыва сокета. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { subscribeMessageActivity } from '../../client/components/editor/analytics/message-activity-live';
import { getMessagesActivitySeries, getMessagesActivitySummary, calculateCumulativeMessages } from '../../shared/analytics/messages-activity';

/** Создаёт наблюдаемый сокет без сети и серверных изменений. */
function setup(tokenId?: number | null) {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  let event!: (data: { type: string; projectId: number; tokenId?: number }) => void;
  let reconnect!: () => void;
  const unsubscribe = vi.fn();
  const unsubscribeReconnect = vi.fn();
  const dispose = subscribeMessageActivity(client, 12, tokenId, listener => {
    event = listener;
    return unsubscribe;
  }, listener => {
    reconnect = listener;
    return unsubscribeReconnect;
  });
  return { client, invalidate, event, reconnect, dispose, unsubscribe, unsubscribeReconnect };
}

afterEach(() => vi.useRealTimers());

describe('сводка сообщений выбранного периода', () => {
  /** Итоги берутся из сырых точек и не зависят от накопительного режима. */
  it('суммирует направления без подмены суммами всей истории', () => {
    const points = [{ date: '2026-11-01', incoming: 2, outgoing: 3 }, { date: '2026-11-02', incoming: 4, outgoing: 5 }];
    const summary = getMessagesActivitySummary(points, 999, 100);
    expect(summary.incomingMessages).toBe(6);
    expect(summary.outgoingMessages).toBe(8);
    expect(summary.periodMessages).toBe(14);
    expect(getMessagesActivitySeries(points).totalPoints.map(point => point.count)).toEqual([5, 9]);
    calculateCumulativeMessages(points);
    expect(getMessagesActivitySummary(points, 999, 100).periodMessages).toBe(14);
    expect(getMessagesActivitySummary([], 999, 100).periodMessages).toBe(0);
  });
});

describe('обновления сообщений по сокету', () => {
  /** Все направления, включая служебное, должны изменять график. */
  it.each(['user', 'bot', 'system'])('обновляет серию для направления %s', messageType => {
    vi.useFakeTimers();
    const live = setup(7);
    live.event({ type: 'new-message', projectId: 12, tokenId: 7, ...{ data: { messageType } } });
    vi.advanceTimersByTime(150);
    expect(live.invalidate).toHaveBeenCalledTimes(1);
    live.dispose();
  });

  /** Чужие проекты и боты не должны сбрасывать кэш текущего выбора. */
  it('сохраняет область проекта, бота и все гранулярности', () => {
    vi.useFakeTimers();
    const live = setup(7);
    live.event({ type: 'new-message', projectId: 13, tokenId: 7 });
    live.event({ type: 'new-message', projectId: 12, tokenId: 8 });
    live.event({ type: 'message-edited', projectId: 12, tokenId: 7 });
    vi.advanceTimersByTime(300);
    expect(live.invalidate).not.toHaveBeenCalled();
    for (const key of [
      ['messages-activity', 12, 7, '1m', true], ['messages-activity', 12, 7, '1d', true], ['users-activity', 12, 7, '1d'],
      ['messages-activity', 12, 8, '1d', true], ['users-activity', 13, 7, '1d'], ['users-activity', 12, null, '1d'],
    ]) live.client.setQueryData(key, 0);
    live.event({ type: 'message-deleted', projectId: 12, tokenId: 7 });
    vi.advanceTimersByTime(150);
    expect(live.client.getQueryCache().getAll().map(query => query.state.isInvalidated)).toEqual([true, true, true, false, false, false]);
    live.dispose();
  });

  /** Весь проект принимает сообщения любого бота и очистку истории без токена. */
  it('обновляет общий проект и объединяет всплески событий', () => {
    vi.useFakeTimers();
    const live = setup(null);
    live.event({ type: 'new-message', projectId: 12, tokenId: 7 });
    live.event({ type: 'new-message', projectId: 12, tokenId: 8 });
    live.event({ type: 'messages-cleared', projectId: 12 });
    vi.advanceTimersByTime(150);
    expect(live.invalidate).toHaveBeenCalledTimes(1);
    live.dispose();
  });

  /** Восстановление повторяет запрос даже без новых событий, очистка отменяет таймер. */
  it('восполняет пропущенные события при reconnect и удаляет подписки', () => {
    vi.useFakeTimers();
    const live = setup(7);
    live.event({ type: 'new-message', projectId: 12, tokenId: 7 });
    live.reconnect();
    expect(live.invalidate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(150);
    expect(live.invalidate).toHaveBeenCalledTimes(1);
    live.event({ type: 'messages-cleared', projectId: 12 });
    live.dispose();
    vi.advanceTimersByTime(1000);
    live.reconnect();
    expect(live.invalidate).toHaveBeenCalledTimes(1);
    expect(live.unsubscribe).toHaveBeenCalledOnce();
    expect(live.unsubscribeReconnect).toHaveBeenCalledOnce();
  });
});
