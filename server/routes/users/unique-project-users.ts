/** @fileoverview Единая запись человека по Telegram ID в режиме всех ботов проекта. */
import { userContactEligibility } from './user-contact-eligibility';
/**
 * Объединяет личные контакты до поиска, сортировки, подсчёта и пагинации.
 * Последние значения переменных побеждают; блокировка действует, когда нет доступного бота.
 * @returns Подзапрос совместимого формата bot_users с областью $1/$2.
 */
export function uniqueProjectUsersSql(): string {
  return `(WITH eligible AS (
    SELECT b.* FROM bot_users b WHERE b.project_id=$1 AND b.is_bot=0
      AND ($2::integer IS NULL OR b.token_id=$2)
      AND ${userContactEligibility('b')}
  ), newest AS (
    SELECT DISTINCT ON(user_id) * FROM eligible ORDER BY user_id,last_interaction DESC NULLS LAST,token_id
  ), summary AS (
    SELECT user_id,MIN(registered_at) registered_at,MAX(last_interaction) last_interaction,
      SUM(COALESCE(interaction_count,0))::integer interaction_count,
      CASE WHEN BOOL_OR(COALESCE(is_active,0)=1 AND COALESCE(is_blocked,0)=0 AND COALESCE(is_deleted,0)=0) THEN 1 ELSE 0 END is_active,
      CASE WHEN BOOL_AND(COALESCE(is_deleted,0)=1 OR COALESCE(is_blocked,0)=1)
        AND NOT BOOL_AND(COALESCE(is_deleted,0)=1) THEN 1 ELSE 0 END is_blocked,
      CASE WHEN BOOL_AND(COALESCE(is_deleted,0)=1) THEN 1 ELSE 0 END is_deleted
    FROM eligible GROUP BY user_id
  ), variables AS (
    SELECT e.user_id,jsonb_object_agg(v.key,v.value ORDER BY e.last_interaction ASC NULLS FIRST,e.token_id DESC) user_data
    FROM eligible e CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(e.user_data)='object'
      THEN e.user_data ELSE '{}'::jsonb END) v GROUP BY e.user_id
  ) SELECT merged.* FROM newest n JOIN summary s USING(user_id) LEFT JOIN variables v USING(user_id)
    CROSS JOIN LATERAL jsonb_populate_record(NULL::bot_users,to_jsonb(n)||jsonb_build_object(
      'registered_at',s.registered_at,'last_interaction',s.last_interaction,'interaction_count',s.interaction_count,
      'is_active',s.is_active,'is_blocked',s.is_blocked,'is_deleted',s.is_deleted,'user_data',COALESCE(v.user_data,'{}'::jsonb))) merged)`;
}
