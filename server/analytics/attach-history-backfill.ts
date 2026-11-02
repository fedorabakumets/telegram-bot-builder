/** @fileoverview Запуск переноса истории после готовности HTTP и остановка вместе с приложением. */
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { startAtomicAnalyticsHistoryBackfill } from './atomic-history-backfill';
/**
 * Подключает жизненный цикл переноса без ожидания фоновой работы при старте сервера.
 * @param server - HTTP-сервер конструктора.
 * @param pool - Пул после SQL-миграций.
 * @returns Отмена подключения и остановка работающего переноса.
 */
export function attachAnalyticsHistoryBackfill(server: Server, pool: Pool): () => void {
  let stop: (() => Promise<void>) | undefined;
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  /** Начинает фоновый перенос только после готовности HTTP. */
  const start = () => { stop = startAtomicAnalyticsHistoryBackfill(pool, { logger: event => {
    console.info('[analytics-history]', JSON.stringify(event));
  } }); };
  /** Отменяет ожидающий старт и освобождает ресурсы при завершении приложения. */
  const shutdown = () => {
    server.removeListener('listening', start);
    server.removeListener('close', shutdown);
    for (const signal of signals) process.removeListener(signal, shutdown);
    const finish = stop; stop = undefined;
    if (finish) void finish().catch(() => console.warn('[analytics-history] Не удалось завершить фоновый перенос'));
  };
  server.once('close', shutdown);
  for (const signal of signals) process.once(signal, shutdown);
  if (server.listening) start(); else server.once('listening', start);
  return shutdown;
}
