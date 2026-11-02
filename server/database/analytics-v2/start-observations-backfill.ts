/** @fileoverview Возобновляемая запись наблюдавшихся /start без изменения точного привлечения и расходов. */
import type { PoolClient } from 'pg';
import { parseStartObservation, type StartObservationRow } from './start-observation';
/**
 * Переносит одну пачку в открытой транзакции, атомарно сохраняя курсор и уведомление.
 * @param client - Соединение транзакции платформы.
 * @param project - Проект.
 * @param token - Бот проекта.
 * @param batchSize - Не более тысячи строк за пачку.
 * @param throughMessageId - Конечная граница запуска.
 * @returns Прогресс без исходных текстов, меток или идентификаторов людей.
 */
export async function backfillStartObservationsBatch(client: PoolClient, project: number, token: number, batchSize = 100, throughMessageId?: number) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1000) throw new Error('Некорректный размер пачки');
  if (throughMessageId !== undefined && (!Number.isSafeInteger(throughMessageId) || throughMessageId < 0)) throw new Error('Некорректная граница истории');
  const { rows: [bot] } = await client.query('SELECT t.bot_username FROM bot_tokens t JOIN bot_projects p ON p.id=t.project_id WHERE t.project_id=$1 AND t.id=$2', [project, token]);
  if (!bot) throw new Error('Бот не принадлежит проекту');
  await client.query('INSERT INTO analytics_start_observation_backfill_v2(project_id,token_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [project, token]);
  const { rows: [checkpoint] } = await client.query('SELECT * FROM analytics_start_observation_backfill_v2 WHERE project_id=$1 AND token_id=$2 FOR UPDATE', [project, token]);
  await client.query('INSERT INTO analytics_versions_v2(project_id) VALUES($1) ON CONFLICT DO NOTHING', [project]);
  await client.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=$1 FOR UPDATE', [project]);
  const { rows } = await client.query<StartObservationRow>(`SELECT m.id,m.user_id,m.message_type,m.message_text,m.message_data,m.telegram_message_id,m.chat_type,m.chat_id,m.created_at,
    EXISTS(SELECT 1 FROM bot_users p WHERE p.project_id=$1 AND p.token_id=$2 AND p.user_id::text=m.user_id AND p.is_bot=1) is_bot,
    EXISTS(SELECT 1 FROM analytics_events_v2 e WHERE e.project_id=$1 AND e.token_id=$2 AND e.directed
      AND e.event_key='msg:'||COALESCE(NULLIF(m.chat_id,''),CASE WHEN m.chat_type='private' THEN m.user_id END)||':'||m.telegram_message_id::text) directed_event
    FROM bot_messages m WHERE m.project_id=$1 AND m.token_id=$2 AND m.id>$3 AND ($5::bigint IS NULL OR m.id<=$5)
      AND m.message_type='user' AND m.message_text LIKE '/start%' ORDER BY m.id LIMIT $4`,
  [project, token, checkpoint.last_message_id, batchSize, throughMessageId ?? null]);
  let imported = 0; let skipped = 0; const reasons: Record<string, number> = {};
  /** Учитывает классифицированный пропуск без содержимого команды. */
  const skip = (reason: string) => { skipped += 1; reasons[reason] = (reasons[reason] || 0) + 1; };
  for (const row of rows) {
    const parsed = parseStartObservation(row, bot.bot_username);
    if (!parsed.observation) { skip(parsed.reason!); continue; }
    const item = parsed.observation;
    const result = await client.query(`INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,marker,category)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE NOT EXISTS(SELECT 1 FROM analytics_person_deletions_v2 d WHERE d.project_id=$1 AND d.token_id=$2
        AND d.person_key=encode(sha256(convert_to($1::text||':'||$2::text||':'||$3::text,'UTF8')),'hex') AND $6::timestamptz<=d.deleted_through)
      ON CONFLICT(project_id,token_id,event_key) DO NOTHING`, [project, token, item.user, row.id, item.key, item.at, item.marker, item.category]);
    if (result.rowCount) imported += 1;
  }
  const complete = rows.length < batchSize || throughMessageId !== undefined && Number(rows[rows.length - 1]?.id ?? checkpoint.last_message_id) >= throughMessageId;
  const last = complete && throughMessageId !== undefined ? Math.max(Number(checkpoint.last_message_id), throughMessageId)
    : rows.length ? rows[rows.length - 1].id : checkpoint.last_message_id;
  const { rows: [progress] } = await client.query(`UPDATE analytics_start_observation_backfill_v2 SET last_message_id=$3,scanned=scanned+$4,
    imported=imported+$5,skipped=skipped+$6,updated_at=clock_timestamp() WHERE project_id=$1 AND token_id=$2 RETURNING last_message_id::text,scanned::text,imported::text,skipped::text`,
  [project, token, last, rows.length, imported, skipped]);
  if (imported) {
    const { rows: [version] } = await client.query('UPDATE analytics_versions_v2 SET revision=revision+1 WHERE project_id=$1 RETURNING revision', [project]);
    await client.query(`INSERT INTO analytics_outbox_v2(project_id,token_id,revision,affected) VALUES($1,$2,$3,ARRAY['sources','acquisition'])`, [project, token, version.revision]);
    await client.query("SELECT pg_notify('analytics_v2_changed',$1)", [String(project)]);
  }
  return { ...progress, complete, batch: { scanned: rows.length, imported, skipped, reasons } };
}
