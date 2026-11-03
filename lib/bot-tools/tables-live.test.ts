/** @fileoverview Проверки внешней записи таблиц: серверное событие, границы проекта и переподключение. */
import { describe, expect, it, vi } from 'vitest';
const events = vi.hoisted(() => ({ publish: vi.fn(), invalidate: vi.fn(), snapshot: vi.fn() }));
vi.mock('../../server/routes/tables/broadcast-content-snapshot', () => ({ broadcastContentSnapshot: events.snapshot }));
vi.mock('../../server/terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: events.publish }));
vi.mock('../../server/database/db-cache', () => ({ cachedOps: { invalidateProject: events.invalidate } }));
vi.mock('../../server/services/content-table', () => ({ syncTableToScenario: vi.fn() }));
vi.mock('../../server/redis/redisClient', () => ({ getRedisPublisher: () => null }));
import { notifyTableChange } from '../../server/routes/tables/notify-table-change';
import { subscribeTableChanges } from '../../client/components/editor/tables/hooks/use-tables-live';
import { isTableLiveKey } from '../../client/components/editor/tables/hooks/table-live-keys';

describe('Внешние изменения таблиц', () => {
  it('рассылает событие проекта, но отказ рассылки не отменяет сохранение', async () => {
    await notifyTableChange(7, 9, 'Товары');
    expect(events.publish).toHaveBeenCalledWith(7, expect.objectContaining({ type: 'table-updated', projectId: 7, data: { tableId: 9 } }));
    events.publish.mockRejectedValueOnce(new Error('offline'));
    await expect(notifyTableChange(7, 9, 'Товары')).resolves.toBeUndefined();
  });
  it('перечитывает только свой проект и восстанавливается после разрыва', () => {
    let receive: (event: unknown) => void = () => {};
    let reconnect: () => void = () => {};
    const stopEvent = vi.fn(); const stopReconnect = vi.fn(); const invalidate = vi.fn();
    const stop = subscribeTableChanges(7, invalidate,
      handler => { receive = handler; return stopEvent; },
      handler => { reconnect = handler; return stopReconnect; });
    receive({ type: 'table-updated', projectId: 8 });
    receive({ type: 'token-updated', projectId: 7 });
    expect(invalidate).not.toHaveBeenCalled();
    receive({ type: 'table-updated', projectId: 7 }); reconnect();
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(isTableLiveKey(['bot-table-rows', 7, 9], 7)).toBe(true);
    expect(isTableLiveKey(['bot-table-columns', 8, 9], 7)).toBe(false);
    expect(isTableLiveKey(['analytics-v2', 7], 7)).toBe(false);
    stop(); expect(stopEvent).toHaveBeenCalledOnce(); expect(stopReconnect).toHaveBeenCalledOnce();
  });
  it('после записи контента обновляет холст отдельно от уведомления таблицы', async () => {
    await notifyTableChange(7, 9, '_content');
    expect(events.snapshot).toHaveBeenCalledWith(7);
    events.snapshot.mockRejectedValueOnce(new Error('disconnected'));
    await expect(notifyTableChange(7, 9, '_content')).resolves.toBeUndefined();
  });
});
