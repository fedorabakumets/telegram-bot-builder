/** @fileoverview Предпросмотр исторического восстановления только агрегатами, без записи и раскрытия переписки. */
import type { PoolClient } from 'pg';
import { classifyLegacyEvidence, validateEvidencePolicy, type LegacyEvidencePolicy, type LegacyEvidenceRow } from './evidence-policy';
import { EVIDENCE_CANDIDATE_SQL } from './evidence-backfill';
/**
 * Считает проверяемых кандидатов в транзакции READ ONLY.
 * @param client - Соединение согласованного предпросмотра.
 * @param input - Явная область аудита.
 * @returns Только безопасные количества; оценка добавления уточняется при записи.
 */
export async function previewAudienceEvidence(client: PoolClient, input: LegacyEvidencePolicy) {
  const policy = validateEvidencePolicy(input);
  if (!(await client.query('SELECT id FROM bot_tokens WHERE project_id=$1 AND id=$2', [policy.projectId, policy.tokenId])).rowCount) throw new Error('Бот не принадлежит проекту');
  const { rows } = await client.query<LegacyEvidenceRow & { existing: boolean }>(`SELECT m.*,
    EXISTS(SELECT 1 FROM analytics_audience_v2 a WHERE a.project_id=m.project_id AND a.token_id=m.token_id AND a.user_id=m.user_id) existing
    FROM bot_messages m JOIN bot_users p ON p.project_id=m.project_id AND p.token_id=m.token_id AND p.user_id::text=m.user_id
    WHERE m.project_id=$1 AND m.token_id=$2 AND m.id<=$3 AND COALESCE(p.is_bot,0)=0 AND m.created_at<=CURRENT_TIMESTAMP
      AND (${EVIDENCE_CANDIDATE_SQL}) AND NOT EXISTS(SELECT 1 FROM analytics_person_deletions_v2 d
        WHERE d.project_id=$1 AND d.token_id=$2 AND d.person_key=encode(sha256(convert_to($1::text||':'||$2::text||':'||m.user_id,'UTF8')),'hex')
        AND m.created_at<=d.deleted_through) ORDER BY m.id`, [policy.projectId, policy.tokenId, policy.throughMessageId]);
  const people = new Set<string>(); const additional = new Set<string>();
  const reasons = { legacy_callback: 0, addressed_command: 0, physical_callback: 0, rejected: 0 };
  for (const row of rows) {
    const reason = classifyLegacyEvidence(row, policy);
    if (!reason) { reasons.rejected += 1; continue; }
    reasons[reason] += 1; people.add(row.user_id); if (!row.existing) additional.add(row.user_id);
  }
  return { candidates: rows.length, reasons, people_with_evidence: people.size, additional_people: additional.size,
    provenance_limit: 'audited_writer_shape_without_per_row_build_identity' };
}
