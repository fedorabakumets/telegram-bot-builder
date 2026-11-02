/** @fileoverview Возобновляемый перенос доказуемых старых событий без выдуманной первой даты аудитории. */
import type { PoolClient } from 'pg';
import { legacyBackfillEvent, type LegacyBackfillRow } from './backfill-event';
/**
 * Переносит одну ограниченную пачку из сохранённой переписки в той же транзакции, что и контрольную точку.
 * @param client - Соединение вызывающей транзакции.
 * @param project - Проект с проверенным владельцем или оператором.
 * @param token - Бот проекта.
 * @param batchSize - Ограничение размера пачки, максимум тысяча.
 * @param throughMessageId - Неизменная верхняя граница автоматического запуска; старый CLI может её не задавать.
 * @returns Прогресс и признак завершения текущей сохранённой истории.
 */
export async function backfillAnalyticsBatch(client: PoolClient, project: number, token: number, batchSize = 500, throughMessageId?: number) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1000) throw new Error('Размер пачки должен быть от 1 до 1000');
  if (throughMessageId !== undefined && (!Number.isSafeInteger(throughMessageId) || throughMessageId < 0)) throw new Error('Некорректная верхняя граница истории');
  if (!(await client.query('SELECT id FROM bot_tokens WHERE project_id=$1 AND id=$2', [project, token])).rowCount) throw new Error('Бот не принадлежит проекту');
  await client.query('INSERT INTO analytics_backfill_v2(project_id,token_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [project, token]);
  const { rows: [checkpoint] } = await client.query('SELECT * FROM analytics_backfill_v2 WHERE project_id=$1 AND token_id=$2 FOR UPDATE', [project, token]);
  const { rows } = await client.query<LegacyBackfillRow>(`SELECT id,user_id,message_type,message_data,telegram_message_id,chat_type,chat_id,created_at
    FROM bot_messages WHERE project_id=$1 AND token_id=$2 AND id>$3 AND ($5::bigint IS NULL OR id<=$5) ORDER BY id LIMIT $4`,
  [project, token, checkpoint.last_message_id, batchSize, throughMessageId ?? null]);
  let imported = 0;
  let skipped = 0;
  const reasons: Record<string, number> = {};
  /** Учитывает безопасную причину пропуска без содержимого исходной строки. */
  const skip = (reason: string) => { skipped += 1; reasons[reason] = (reasons[reason] || 0) + 1; };
  for (const row of rows) {
    const event = legacyBackfillEvent(row, project, token);
    if (!event.payload) { skip(event.reason!); continue; }
    await client.query('SAVEPOINT analytics_legacy_row');
    try {
      const { rows: [record] } = await client.query('SELECT record_analytics_event_v2($1::jsonb) result', [JSON.stringify(event.payload)]);
      if (record.result.inserted) imported += 1;
    } catch (error) {
      const code = (error as { code?: string }).code || '';
      await client.query('ROLLBACK TO SAVEPOINT analytics_legacy_row');
      if (!/^22[A-Z0-9]{3}$/.test(code) && code !== '23514') { await client.query('RELEASE SAVEPOINT analytics_legacy_row'); throw error; }
      skip(`invalid_row_${code}`);
    }
    await client.query('RELEASE SAVEPOINT analytics_legacy_row');
  }
  const complete = rows.length < batchSize || throughMessageId !== undefined && Number(rows[rows.length - 1]?.id ?? checkpoint.last_message_id) >= throughMessageId;
  const last = complete && throughMessageId !== undefined ? Math.max(Number(checkpoint.last_message_id), throughMessageId)
    : rows.length ? rows[rows.length - 1].id : checkpoint.last_message_id;
  const { rows: [progress] } = await client.query(`UPDATE analytics_backfill_v2 SET last_message_id=$3,
    scanned=scanned+$4,imported=imported+$5,skipped=skipped+$6,updated_at=clock_timestamp() WHERE project_id=$1 AND token_id=$2
    RETURNING last_message_id::text,scanned::text,imported::text,skipped::text,updated_at`, [project, token, last, rows.length, imported, skipped]);
  return { ...progress, complete, batch: { scanned: rows.length, imported, skipped, reasons } };
}
