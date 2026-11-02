/** @fileoverview Отдельный возобновляемый перенос аудированных свидетельств после завершённого backfill событий. */
import type { PoolClient } from 'pg';
import { validateEvidencePolicy, type LegacyEvidencePolicy, type LegacyEvidenceRow } from './evidence-policy';
import { recordLegacyEvidence } from './evidence-write';
/** Условие выбирает только кандидатов, не копируя обычную групповую переписку. */
export const EVIDENCE_CANDIDATE_SQL = `message_type='user' AND (message_data->>'button_clicked'='true' OR message_text ~ '^/[A-Za-z0-9_]{1,32}@')`;
/**
 * Переносит одну пачку; вызывающий код обязан открыть и завершить общую транзакцию.
 * @param client - Соединение транзакции.
 * @param input - Одобренная политика аудита, неизменная для данного курсора.
 * @param batchSize - Максимум кандидатов в одной пачке.
 * @returns Безопасный прогресс без идентификаторов людей и содержимого истории.
 */
export async function backfillAudienceEvidenceBatch(client: PoolClient, input: LegacyEvidencePolicy, batchSize = 500) {
  const policy = validateEvidencePolicy(input);
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1000) throw new Error('Размер пачки должен быть от 1 до 1000');
  if (!(await client.query('SELECT id FROM bot_tokens WHERE project_id=$1 AND id=$2', [policy.projectId, policy.tokenId])).rowCount) throw new Error('Бот не принадлежит проекту');
  const params = [policy.projectId, policy.tokenId, policy.writerSha256, policy.historicalUsername, policy.throughMessageId];
  await client.query(`INSERT INTO analytics_evidence_backfill_v2(project_id,token_id,writer_sha256,historical_username,through_message_id)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, params);
  const { rows: [job] } = await client.query(`SELECT * FROM analytics_evidence_backfill_v2 WHERE project_id=$1 AND token_id=$2
    AND writer_sha256=$3 AND historical_username=$4 AND through_message_id=$5 FOR UPDATE`, params);
  await client.query('INSERT INTO analytics_versions_v2(project_id) VALUES($1) ON CONFLICT DO NOTHING', [policy.projectId]);
  await client.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=$1 FOR UPDATE', [policy.projectId]);
  const { rows } = await client.query<LegacyEvidenceRow>(`SELECT id,user_id,message_type,message_text,message_data,telegram_message_id,chat_type,chat_id,created_at,node_id
    FROM bot_messages WHERE project_id=$1 AND token_id=$2 AND id>$3 AND id<=$4 AND ${EVIDENCE_CANDIDATE_SQL} ORDER BY id LIMIT $5`,
  [policy.projectId, policy.tokenId, job.last_message_id, policy.throughMessageId, batchSize]);
  const added = { evidence: 0, audience: 0, physical: 0 };
  for (const row of rows) {
    const item = await recordLegacyEvidence(client, policy, String(job.id), row);
    added.evidence += item.evidence; added.audience += item.audience; added.physical += item.physical;
  }
  const complete = rows.length < batchSize;
  const last = complete ? policy.throughMessageId : rows[rows.length - 1].id;
  const { rows: [progress] } = await client.query(`UPDATE analytics_evidence_backfill_v2 SET last_message_id=$2,scanned=scanned+$3,
    evidence_count=evidence_count+$4,audience_added=audience_added+$5,physical_callbacks=physical_callbacks+$6,updated_at=clock_timestamp()
    WHERE id=$1 RETURNING last_message_id::text,scanned::text,evidence_count::text,audience_added::text,physical_callbacks::text`,
  [job.id, last, rows.length, added.evidence, added.audience, added.physical]);
  if (added.evidence) {
    const { rows: [version] } = await client.query('UPDATE analytics_versions_v2 SET revision=revision+1 WHERE project_id=$1 RETURNING revision', [policy.projectId]);
    await client.query(`INSERT INTO analytics_outbox_v2(project_id,token_id,revision,affected) VALUES($1,$2,$3,ARRAY['audience','sources','activity','coverage'])`,
      [policy.projectId, policy.tokenId, version.revision]);
    await client.query("SELECT pg_notify('analytics_v2_changed',$1)", [String(policy.projectId)]);
  }
  return { ...progress, complete };
}
