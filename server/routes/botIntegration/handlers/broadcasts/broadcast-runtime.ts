/**
 * @fileoverview Восстановление рассылок исполнителем с единственным владельцем в PostgreSQL.
 */

import { pool } from "../../../../database/db";
import type { PoolClient } from "pg";
import { suppressPoolClientHoldWarning } from "../../../../database/pool-diagnostics";
import { startAdaptivePoller } from "../../../../utils/adaptive-poller";
import { runBroadcastQueue } from "./broadcastQueue";
import { syncCampaignAggregates } from "./sync-campaign-aggregates";

/** Пространство блокировок рассылок в PostgreSQL. */
const LOCK_NAMESPACE = 641237;
/** Число одновременных рассылок с учётом соединений пула. */
const MAX_RUNNING = 3;
/** Активные задания данного процесса. */
const active = new Set<number>();

/**
 * Захватывает задание на всё время отправки и восстанавливает его после сбоя процесса.
 * @param id - Идентификатор рассылки
 * @returns Завершение попытки исполнения
 */
async function executeBroadcast(id: number): Promise<void> {
  let client: PoolClient | undefined;
  let locked = false;
  try {
    client = await pool.connect();
    suppressPoolClientHoldWarning(client);
    const claim = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1, $2) AS locked", [LOCK_NAMESPACE, id],
    );
    locked = claim.rows[0]?.locked === true;
    if (!locked) return;
    const job = await client.query<{ token: string | null; is_active: number | null; campaign_id: number | null }>(
      `SELECT t.token, t.is_active, b.campaign_id FROM broadcasts b
       LEFT JOIN bot_tokens t ON t.id = b.token_id
       WHERE b.id = $1 AND b.status IN ('pending', 'running')`, [id],
    );
    if (!job.rows[0]) return;
    if (!job.rows[0].token || job.rows[0].is_active !== 1) {
      await client.query(
        "UPDATE broadcasts SET status = 'failed', finished_at = NOW() WHERE id = $1 AND status IN ('pending', 'running')",
        [id],
      );
      await syncCampaignAggregates(job.rows[0].campaign_id);
      return;
    }
    await client.query(
      "UPDATE broadcasts SET status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = $1 AND status = 'pending'",
      [id],
    );
    await runBroadcastQueue(id, job.rows[0].token);
  } catch (error) {
    console.error(`[broadcastRuntime] Ошибка рассылки ${id}:`, error);
  } finally {
    let discard = false;
    if (locked && client) {
      try {
        await client.query("SELECT pg_advisory_unlock($1, $2)", [LOCK_NAMESPACE, id]);
      } catch (error) {
        discard = true;
        console.error(`[broadcastRuntime] Ошибка снятия блокировки ${id}:`, error);
      }
    }
    client?.release(discard);
    active.delete(id);
  }
}

/**
 * Находит незавершённые задания и запускает те, которыми ещё не владеет процесс.
 * @returns Наличие незавершённых заданий или занятых слотов исполнителя
 */
export async function reconcileBroadcasts(): Promise<boolean> {
  if (active.size >= MAX_RUNNING) return true;
  const found = await pool.query<{ id: number }>(
    "SELECT id FROM broadcasts WHERE status IN ('pending', 'running') ORDER BY id LIMIT 100",
  );
  for (const { id } of found.rows) {
    if (active.size >= MAX_RUNNING) break;
    if (active.has(id)) continue;
    active.add(id);
    void executeBroadcast(id);
  }
  return found.rows.length > 0 || active.size > 0;
}

/**
 * Запускает периодическое восстановление рассылок из базы данных.
 * @param intervalMs - Минимальная пауза; пустая очередь проверяется не реже одного раза в 10 секунд
 * @returns Функция остановки новых проходов
 */
export function startBroadcastRuntime(intervalMs = 2_000): () => void {
  return startAdaptivePoller({
    poll: reconcileBroadcasts,
    intervalMs,
    maxIntervalMs: Math.max(intervalMs, 10_000),
    onError: (error) => console.error("[broadcastRuntime] Ошибка восстановления:", error),
  });
}
