/** @fileoverview Перенос истории запускается только после готовности HTTP и корректно отменяется. */
import { createServer } from 'node:http';
import type { Pool } from 'pg';
import { afterEach, expect, it, vi } from 'vitest';
import { attachAnalyticsHistoryBackfill } from './attach-history-backfill';
/** Подмена исполнителя проверяет реальное подключение жизненного цикла, не обращаясь к БД. */
const mocks = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(async () => undefined), markers: vi.fn(), stopMarkers: vi.fn(async () => undefined) }));
vi.mock('./atomic-history-backfill', () => ({ startAtomicAnalyticsHistoryBackfill: mocks.start }));
vi.mock('./start-observations-backfill', () => ({ startAnalyticsStartObservationsBackfill: mocks.markers }));
afterEach(() => { vi.clearAllMocks(); });
it('не задерживает подготовку HTTP и останавливает перенос при закрытии', () => {
  mocks.start.mockReturnValue(mocks.stop);
  const server = createServer();
  const cleanup = attachAnalyticsHistoryBackfill(server, {} as Pool);
  try {
    expect(mocks.start).not.toHaveBeenCalled();
    server.emit('listening');
    expect(mocks.start).toHaveBeenCalledTimes(1);
    server.emit('close');
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    cleanup();
    expect(mocks.stop).toHaveBeenCalledTimes(1);
  } finally { cleanup(); }
});
it('отмена до готовности HTTP не оставляет ожидающий запуск', () => {
  const server = createServer();
  const cleanup = attachAnalyticsHistoryBackfill(server, {} as Pool);
  cleanup(); server.emit('listening');
  expect(mocks.start).not.toHaveBeenCalled();
});
it('запускает оба контура одним исполнителем без второго промежуточного запуска', () => {
  mocks.start.mockReturnValue(mocks.stop);
  const server=createServer();const cleanup=attachAnalyticsHistoryBackfill(server,{} as Pool);
  server.emit('listening');
  expect(mocks.start).toHaveBeenCalledTimes(1);
  mocks.start.mock.calls[0][1].logger({event:'completed',scopes:2});
  expect(mocks.markers).not.toHaveBeenCalled();
  cleanup();expect(mocks.stop).toHaveBeenCalledTimes(1);
});
