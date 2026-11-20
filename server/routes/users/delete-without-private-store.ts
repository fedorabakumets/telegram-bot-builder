/** @fileoverview Подсчёт и атомарная очистка пользователей по подтверждённому критерию. */
import type { Pool } from 'pg';
import { confirmedPrivateContactSql } from './user-contact-origin-sql';
import { userContactEligibility } from './user-contact-eligibility';
/** Вариант подтверждённой очистки пользователей. */
export type UserCleanupKind = 'without-private' | 'deleted';
/** Создаёт область выбранного вида очистки, согласованную со статусом сводной строки. @param kind - Вид очистки. @returns Статический SQL без значений клиента. */
function cleanupWhere(kind: UserCleanupKind): string {
  const condition = kind === 'deleted' ? `u.is_deleted=1 AND ($2::integer IS NOT NULL OR NOT EXISTS(
    SELECT 1 FROM bot_users other WHERE other.project_id=u.project_id AND other.user_id=u.user_id AND other.is_bot=0
      AND ${userContactEligibility('other')} AND COALESCE(other.is_deleted,0)<>1))` : `NOT ${confirmedPrivateContactSql('u',true)}`;
  return `u.project_id=$1 AND ($2::integer IS NULL OR u.token_id=$2) AND u.is_bot=0
    AND ${userContactEligibility('u')} AND (${condition})`;
}
/** Количества людей и отдельных связей с ботами. */
export interface WithoutPrivateCounts {
  /** Уникальные люди в выбранной области. */ people: number;
  /** Карточки с переменными в отдельных ботах. */ botRecords: number;
}
/** Подсчитывает кандидатов без изменения сообщений и карточек. @param database - Пул. @param projectId - Разрешённый проект. @param tokenId - Бот либо весь проект. @returns Точные количества. */
export async function countWithoutPrivateContacts(database: Pick<Pool,'query'>, projectId: number, tokenId: number | null, kind: UserCleanupKind = 'without-private'): Promise<WithoutPrivateCounts> {
  const { rows } = await database.query(`SELECT COUNT(DISTINCT u.user_id)::integer people,COUNT(*)::integer "botRecords"
    FROM bot_users u WHERE ${cleanupWhere(kind)}`, [projectId,tokenId]);
  return rows[0];
}
/** Удаляет только профили после повторной проверки; групповая история и факты аналитики сохраняются. @param database - Пул. @param projectId - Проект. @param tokenId - Бот либо весь проект. @param expected - Подтверждённое количество. @returns Реальное количество удалённых карточек и людей. */
export async function deleteWithoutPrivateContacts(database: Pick<Pool,'connect'>, projectId: number, tokenId: number | null, expected: WithoutPrivateCounts, kind: UserCleanupKind = 'without-private'): Promise<WithoutPrivateCounts> {
  const where = cleanupWhere(kind);
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    /** Блокировка карточек не позволяет параллельному изменению профиля пройти незамеченным. */
    await client.query(`SELECT u.user_id FROM bot_users u WHERE ${where} FOR UPDATE OF u`, [projectId,tokenId]);
    const current = await countWithoutPrivateContacts(client,projectId,tokenId,kind);
    if (current.people !== expected.people || current.botRecords !== expected.botRecords) throw new Error('selection_changed');
    const { rows } = await client.query(`WITH removed AS (DELETE FROM bot_users u WHERE ${where} RETURNING u.user_id)
      SELECT COUNT(DISTINCT user_id)::integer people,COUNT(*)::integer "botRecords" FROM removed`, [projectId,tokenId]);
    await client.query('COMMIT');
    return rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
