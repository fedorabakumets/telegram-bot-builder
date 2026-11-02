/** @fileoverview Автоматический перенос строгих свидетельств старого писателя для всех существующих проектов и ботов. */
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import {backfillAudienceEvidenceBatch,EVIDENCE_CANDIDATE_SQL} from '../database/analytics-v2/evidence-backfill';
import type {LegacyEvidencePolicy} from '../database/analytics-v2/evidence-policy';
/** Версия проверенных правил; fingerprint относится к политике, а не вымышленной старой сборке. */
const POLICY_SHA=createHash('sha256').update('botcraft:auto-evidence:strict-shape-current-username:v1').digest('hex');
/** Фиксирует только оставшихся кандидатов, используя отдельный постоянный курсор автоматической политики. */
export async function captureAutomaticEvidenceScopes(client:PoolClient):Promise<LegacyEvidencePolicy[]> {
  const {rows}=await client.query(`SELECT m.project_id,m.token_id,lower(t.bot_username) username,MAX(m.id)::text through
    FROM bot_messages m JOIN bot_tokens t ON t.id=m.token_id AND t.project_id=m.project_id JOIN bot_projects p ON p.id=t.project_id
    WHERE t.bot_username ~ '^[A-Za-z0-9_]{1,32}$' AND ${EVIDENCE_CANDIDATE_SQL}
      AND m.id>COALESCE((SELECT MAX(b.last_message_id) FROM analytics_evidence_backfill_v2 b
        WHERE b.project_id=m.project_id AND b.token_id=m.token_id AND b.writer_sha256=$1 AND b.historical_username=lower(t.bot_username)),0)
    GROUP BY m.project_id,m.token_id,t.bot_username ORDER BY m.project_id,m.token_id`,[POLICY_SHA]);
  return rows.map(row=>({projectId:row.project_id,tokenId:row.token_id,throughMessageId:Number(row.through),historicalUsername:row.username,writerSha256:POLICY_SHA}));
}
/**
 * Переносит свидетельства внутри общей транзакции, не объявляя неизвестные callback физическими нажатиями.
 * @param client - Соединение атомарного переноса.
 * @param scopes - Неизменные границы и текущие подтверждённые username ботов.
 * @param signal - Отмена с общим откатом.
 * @param size - Ограничение чтения, не отдельная транзакция.
 */
export async function transferAutomaticEvidence(client:PoolClient,scopes:LegacyEvidencePolicy[],signal:AbortSignal,size:number) {
  for(const policy of scopes) {
    /** Новая верхняя граница продолжает завершённый автоматический курсор, не пересканируя всю историю. */
    await client.query(`INSERT INTO analytics_evidence_backfill_v2(project_id,token_id,writer_sha256,historical_username,through_message_id,last_message_id,provenance_limit)
      SELECT $1,$2,$3,$4,$5,COALESCE(MAX(last_message_id),0),'automatic_strict_writer_shape_current_username'
      FROM analytics_evidence_backfill_v2 WHERE project_id=$1 AND token_id=$2 AND writer_sha256=$3 AND historical_username=$4
      ON CONFLICT DO NOTHING`,[policy.projectId,policy.tokenId,policy.writerSha256,policy.historicalUsername,policy.throughMessageId]);
    let complete=false;
    while(!complete) {signal.throwIfAborted();complete=(await backfillAudienceEvidenceBatch(client,policy,size)).complete;}
  }
}
