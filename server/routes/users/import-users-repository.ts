/** @fileoverview Атомарный импорт пользователей с заполнением отсутствующих данных и сохранением существующих переменных. */
import type { Pool } from 'pg';
import { pool } from '../../database/db';
import type { ImportUser } from './import-users-schema';
/** Итог предварительного просмотра либо записи. */
export interface ImportUsersResult {
  /** Уникальные Telegram ID. */ total: number;
  /** Новые контакты. */ created: number;
  /** Дополненные записи. */ updated: number;
  /** Уже существующие идентичные записи. */ unchanged: number;
  /** Применены ли изменения. */ applied: boolean;
}
/** Заполняет только отсутствующие значения профиля. */
const profileFields = ['username', 'first_name', 'last_name', 'language_code', 'deep_link_param', 'referrer_id'] as const;
/** Доверенные присваивания: данные файла всегда передаются отдельным JSON-параметром. */
const updates = profileFields.map(field => `${field}=COALESCE(NULLIF(BTRIM(bot_users.${field}),''),EXCLUDED.${field})`);
/**
 * Проверяет либо применяет импорт в одном соединении; повторный импорт не меняет уже заполненные значения.
 * @param projectId - Авторизованный проект.
 * @param tokenId - Явно проверенный целевой бот.
 * @param users - Проверенные строки без состояний Telegram и статистики.
 * @param apply - Записать изменения или только посчитать.
 * @param poolOverride - Изолированный пул для интеграционных проверок.
 * @returns Количество созданных, дополненных и неизменённых контактов.
 */
export async function importUsers(projectId: number, tokenId: number, users: ImportUser[], apply: boolean, poolOverride: Pool = pool): Promise<ImportUsersResult> {
  /** Внутри файла побеждает первая строка; повторы дополняют только отсутствующие переменные. */
  const unique = new Map<string, ImportUser>();
  for (const user of users) {
    const prior = unique.get(user.userId);
    unique.set(user.userId, prior ? { ...user, ...prior, userData: { ...user.userData, ...prior.userData } } : user);
  }
  const rows = [...unique.values()].map(user => ({ user_id: user.userId, username: user.userName?.trim() || null,
    first_name: user.firstName?.trim() || null, last_name: user.lastName?.trim() || null,
    language_code: user.languageCode?.trim() || null, deep_link_param: user.deepLinkParam?.trim() || null,
    referrer_id: user.referrerId?.trim() || null, is_premium: user.isPremium ? 1 : 0, user_data: user.userData ?? {} }));
  const client = await poolOverride.connect();
  try {
    await client.query('BEGIN');
    /** Одновременные импорты одной области последовательно строят достоверный итог. */
    await client.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [projectId, tokenId]);
    const input = `SELECT * FROM jsonb_to_recordset($3::jsonb) AS i(user_id bigint,username text,first_name text,last_name text,
      language_code text,deep_link_param text,referrer_id text,is_premium integer,user_data jsonb)`;
    const changed = profileFields.map(field => `COALESCE(NULLIF(BTRIM(b.${field}),''),i.${field}) IS DISTINCT FROM b.${field}`).join(' OR ');
    const params = [projectId, tokenId, JSON.stringify(rows)];
    const count = await client.query(`WITH incoming AS (${input}) SELECT COUNT(*)::integer total,
      COUNT(*) FILTER(WHERE b.user_id IS NULL)::integer created,
      COUNT(*) FILTER(WHERE b.user_id IS NOT NULL AND (${changed}
        OR b.imported_at IS NULL OR ((CASE WHEN b.user_data IS NULL OR jsonb_typeof(b.user_data)='object'
          THEN i.user_data||COALESCE(b.user_data,'{}'::jsonb) ELSE b.user_data END) IS DISTINCT FROM b.user_data)))::integer updated
      FROM incoming i LEFT JOIN bot_users b ON b.project_id=$1 AND b.token_id=$2 AND b.user_id=i.user_id`, params);
    if (apply) await client.query(`INSERT INTO bot_users(user_id,project_id,token_id,username,first_name,last_name,
      language_code,deep_link_param,referrer_id,is_premium,user_data,is_active,last_interaction,imported_at)
      SELECT user_id,$1,$2,username,first_name,last_name,language_code,deep_link_param,referrer_id,is_premium,user_data,0,NULL,NOW() FROM (${input}) input
      ON CONFLICT(user_id,project_id,token_id) DO UPDATE SET ${updates.join(',')},
        imported_at=COALESCE(bot_users.imported_at,NOW()),
        user_data=CASE WHEN bot_users.user_data IS NULL OR jsonb_typeof(bot_users.user_data)='object'
          THEN EXCLUDED.user_data||COALESCE(bot_users.user_data,'{}'::jsonb) ELSE bot_users.user_data END`, params);
    await client.query('COMMIT');
    const result = count.rows[0];
    return { ...result, unchanged: result.total - result.created - result.updated, applied: apply };
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { client.release(); }
}
