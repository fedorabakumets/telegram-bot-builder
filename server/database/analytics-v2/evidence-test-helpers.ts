/** @fileoverview Общие фикстуры изолированных проверок исторических свидетельств. */
import type { PoolClient } from 'pg';
import type { LegacyEvidencePolicy } from './evidence-policy';
/**
 * Создаёт человека и строку старого аудированного writer без Telegram callback ID.
 * @param client - Тестовая транзакция.
 * @param user - Тестовый человек.
 * @param token - Тестовый бот первого проекта.
 * @param date - Дата сохранения доказательства.
 * @returns Политика, ограниченная новой строкой.
 */
export async function seedLegacyEvidence(client: PoolClient, user = '100', token = 11, date = '2026-10-10T10:00:00Z'): Promise<LegacyEvidencePolicy> {
  await client.query('INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,$1,$2) ON CONFLICT DO NOTHING', [token, user]);
  const { rows: [row] } = await client.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,message_data,created_at)
    VALUES(1,$1,$2,'user','supergroup','-100','{"button_clicked":true,"button_text":"Меню","callback_data":"legacy"}',$3) RETURNING id`, [token, user, date]);
  return { projectId: 1, tokenId: token, throughMessageId: row.id, historicalUsername: 'first_bot', writerSha256: 'a'.repeat(64) };
}
