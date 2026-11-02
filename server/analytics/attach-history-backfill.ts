/** @fileoverview Запуск переноса истории после готовности HTTP и остановка вместе с приложением. */
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { startAnalyticsHistoryBackfill } from './history-backfill';
import { startAnalyticsStartObservationsBackfill } from './start-observations-backfill';
/**
 * Подключает жизненный цикл переноса без ожидания фоновой работы при старте сервера.
 * @param server - HTTP-сервер конструктора.
 * @param pool - Пул после SQL-миграций.
 * @returns Отмена подключения и остановка работающего переноса.
 */
export function attachAnalyticsHistoryBackfill(server: Server, pool: Pool): () => void {
  let stop: (() => Promise<void>) | undefined;
  let stopMarkers: (() => Promise<void>) | undefined;
  let closed = false;
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  /** Начинает фоновый перенос только после готовности HTTP. */
  const start = () => { stop = startAnalyticsHistoryBackfill(pool, { logger: event => {
    console.info('[analytics-history]', JSON.stringify(event));
    if (['completed', 'failed'].includes(event.event) && !closed && !stopMarkers) stopMarkers = startAnalyticsStartObservationsBackfill(pool);
  } }); };
  /** Отменяет ожидающий старт и освобождает ресурсы при завершении приложения. */
  const shutdown = () => {
    closed = true;
    server.removeListener('listening', start);
    server.removeListener('close', shutdown);
    for (const signal of signals) process.removeListener(signal, shutdown);
    const finish = stop; stop = undefined;
    const finishMarkers = stopMarkers; stopMarkers = undefined;
    if (finish) void finish().catch(() => console.warn('[analytics-history] Не удалось завершить фоновый перенос'));
    if (finishMarkers) void finishMarkers().catch(() => console.warn('[analytics-start-observations] Не удалось завершить фоновый перенос'));
  };
  server.once('close', shutdown);
  for (const signal of signals) process.once(signal, shutdown);
  if (server.listening) start(); else server.once('listening', start);
  return shutdown;
}
