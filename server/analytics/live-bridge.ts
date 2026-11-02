/** @fileoverview Восстановление живых уведомлений из PostgreSQL независимо от доступности Redis. */
import type { Pool, PoolClient } from 'pg';
import { broadcastProjectEventLocal } from '../terminal/broadcastProjectEvent';
import { setAnalyticsTransportStatus } from './live-status';
/** Запускает LISTEN и сверку сохранённых версий при подключении и уведомлениях. */
export function startAnalyticsLiveBridge(pool: Pool): () => void {
  const versions = new Map<number, bigint>();
  let client: PoolClient | undefined, stopped = false, generation = 0;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  /** Публикует последнюю версию проекта; отдельные изменения объединяются. */
  async function reconcile(current: () => boolean): Promise<void> {
    if (!current()) return;
    const { rows } = await pool.query('SELECT project_id,revision FROM analytics_versions_v2');
    for (const row of rows) {
      if (!current()) return;
      const previous = versions.get(row.project_id) ?? 0n;
      if (BigInt(row.revision) <= previous) continue;
      const changes = await pool.query(`SELECT DISTINCT unnest(affected) AS report FROM analytics_outbox_v2
        WHERE project_id=$1 AND revision>$2 AND revision<=$3`, [row.project_id, previous.toString(), row.revision]);
      if (!current()) return;
      await broadcastProjectEventLocal(row.project_id, {
        type: 'analytics-changed', projectId: row.project_id,
        data: { revision: String(row.revision), affected: changes.rows.map(item => item.report) },
        timestamp: new Date().toISOString(),
      });
      if (BigInt(row.revision) > (versions.get(row.project_id) ?? 0n)) versions.set(row.project_id, BigInt(row.revision));
    }
  }
  /** Отказывает безопасно и повторно подключается с последующей сверкой версий. */
  function recover(epoch: number): void {
    if (stopped || reconnect || generation !== epoch) return;
    generation++;
    void setAnalyticsTransportStatus(false).catch(() => undefined);
    const failed = client;
    client = undefined;
    if (debounce) { clearTimeout(debounce); debounce = undefined; }
    if (failed) { failed.removeAllListeners('notification'); failed.removeAllListeners('end'); failed.release(true); }
    reconnect = setTimeout(() => { reconnect = undefined; void connect(); }, 3000);
    reconnect.unref();
  }
  /** Сначала подписывается, затем восстанавливает пропущенные версии. */
  async function connect(): Promise<void> {
    const epoch = ++generation;
    try {
      const listener = await pool.connect();
      if (stopped || epoch !== generation) { listener.release(); return; }
      client = listener;
      /** Старые соединения не могут менять состояние нового канала. */
      const current = () => !stopped && epoch === generation && client === listener;
      let running: Promise<void> | undefined, pending = false;
      /** Сериализует сверки одного соединения, сохраняя событие во время запроса. */
      function sync(): Promise<void> {
        pending = true;
        if (!running) running = (async () => {
          do { pending = false; await reconcile(current); } while (pending && current());
        })().finally(() => { running = undefined; });
        return running;
      }
      listener.on('error', () => recover(epoch));
      listener.on('end', () => recover(epoch));
      listener.on('notification', () => {
        if (debounce || !current()) return;
        debounce = setTimeout(() => { debounce = undefined; void sync().catch(() => recover(epoch)); }, 120);
        debounce.unref();
      });
      await listener.query('LISTEN analytics_v2_changed');
      if (!current()) return;
      await sync();
      if (current()) await setAnalyticsTransportStatus(true);
    } catch { recover(epoch); }
  }
  void connect();
  /** Завершает выделенное соединение и таймеры при остановке сервера. */
  return () => {
    stopped = true;
    generation++;
    if (reconnect) clearTimeout(reconnect);
    if (debounce) clearTimeout(debounce);
    const closing = client;
    client = undefined;
    if (closing) { closing.removeAllListeners('notification'); closing.removeAllListeners('end'); closing.release(true); }
  };
}
