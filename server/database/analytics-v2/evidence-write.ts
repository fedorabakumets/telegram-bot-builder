/** @fileoverview Запись свидетельства аудитории без увеличения числа физических событий и без ложного первого привлечения. */
import type { PoolClient } from 'pg';
import { classifyLegacyEvidence, type LegacyEvidencePolicy, type LegacyEvidenceRow } from './evidence-policy';
/**
 * Добавляет проверенное свидетельство под общей транзакционной блокировкой проекта.
 * @param client - Соединение транзакции переноса.
 * @param policy - Явная область проверенной истории.
 * @param jobId - Контрольная точка этой политики.
 * @param row - Строка истории из той же области.
 * @returns Число новых свидетельств, людей и физических callback.
 */
export async function recordLegacyEvidence(client: PoolClient, policy: LegacyEvidencePolicy, jobId: string, row: LegacyEvidenceRow) {
  const result = { evidence: 0, audience: 0, physical: 0 };
  const reason = classifyLegacyEvidence(row, policy);
  if (!reason || !row.created_at || !Number.isFinite(new Date(row.created_at).getTime()) || new Date(row.created_at).getTime() > Date.now()) return result;
  /** Проверяет область политики и исходной строки даже при ошибочном прямом вызове помощника. */
  const scoped = await client.query(`SELECT 1 FROM analytics_evidence_backfill_v2 j JOIN bot_messages m
    ON m.project_id=j.project_id AND m.token_id=j.token_id AND m.id=$4 AND m.user_id=$5
    WHERE j.id=$3 AND j.project_id=$1 AND j.token_id=$2 AND m.id<=j.through_message_id
      AND j.writer_sha256=$6 AND j.historical_username=$7 AND j.through_message_id=$8`,
  [policy.projectId, policy.tokenId, jobId, row.id, row.user_id, policy.writerSha256, policy.historicalUsername, policy.throughMessageId]);
  if (!scoped.rowCount) throw new Error('Свидетельство не принадлежит проверенной области истории');
  const eligible = await client.query(`SELECT 1 FROM bot_users p WHERE p.project_id=$1 AND p.token_id=$2 AND p.user_id::text=$3 AND COALESCE(p.is_bot,0)=0
    AND NOT EXISTS(SELECT 1 FROM analytics_person_deletions_v2 d WHERE d.project_id=$1 AND d.token_id=$2
      AND d.person_key=encode(sha256(convert_to($1::text||':'||$2::text||':'||$3::text,'UTF8')),'hex') AND $4::timestamptz<=d.deleted_through)`,
  [policy.projectId, policy.tokenId, row.user_id, row.created_at]);
  if (!eligible.rowCount) return result;
  if (reason === 'physical_callback') {
    const id = String(row.message_data?.callback_query_id ?? row.message_data?.callback_id);
    const { rows: [record] } = await client.query('SELECT record_analytics_event_v2($1::jsonb) result', [JSON.stringify({ project_id: policy.projectId,
      token_id: policy.tokenId, event_key: `cb:${id}`, kind: 'callback', user_id: row.user_id, chat_id: row.chat_id || (row.chat_type === 'private' ? row.user_id : null),
      chat_type: row.chat_type, directed: true, occurred_at: new Date(row.created_at).toISOString(), provenance: 'backfill', first_known: false,
      attribution_status: 'unknown', metadata: { button_label: row.message_data?.button_text } })]);
    result.physical = record.result.inserted ? 1 : 0;
    return result;
  }
  const { rows: [evidence] } = await client.query(`INSERT INTO analytics_audience_evidence_v2
    (project_id,token_id,user_id,legacy_message_id,reason,observed_at,chat_type,chat_id,policy_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(project_id,token_id,legacy_message_id) DO NOTHING RETURNING id`,
  [policy.projectId, policy.tokenId, row.user_id, row.id, reason, row.created_at, row.chat_type, row.chat_id || (row.chat_type === 'private' ? row.user_id : null), jobId]);
  if (!evidence) return result;
  result.evidence = 1;
  const added = await client.query(`INSERT INTO analytics_audience_v2(project_id,token_id,user_id,first_interaction_at,last_interaction_at,
    first_event_id,legacy_evidence_id,first_known,attribution_status) VALUES($1,$2,$3,$4,$4,NULL,$5,false,'unknown')
    ON CONFLICT(project_id,token_id,user_id) DO NOTHING`, [policy.projectId, policy.tokenId, row.user_id, row.created_at, evidence.id]);
  result.audience = added.rowCount || 0;
  /** Более раннее доказательство отменяет прежнее предположение о первом привлечении; исходный live event остаётся. */
  await client.query(`UPDATE analytics_audience_v2 SET last_interaction_at=GREATEST(last_interaction_at,$4::timestamptz)
    WHERE project_id=$1 AND token_id=$2 AND user_id=$3`, [policy.projectId, policy.tokenId, row.user_id, row.created_at]);
  await client.query(`UPDATE analytics_audience_v2 SET first_interaction_at=$4,first_event_id=NULL,legacy_evidence_id=$5,first_known=false,
    source_id=NULL,link_id=NULL,placement_id=NULL,referrer_id=NULL,purpose=NULL,observed_tag=NULL,attribution_status='unknown'
    WHERE project_id=$1 AND token_id=$2 AND user_id=$3 AND first_interaction_at>$4`, [policy.projectId, policy.tokenId, row.user_id, row.created_at, evidence.id]);
  return result;
}
