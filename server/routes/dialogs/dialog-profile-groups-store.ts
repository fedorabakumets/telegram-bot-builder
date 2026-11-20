/** @fileoverview Пакетное чтение групп пользователя по записям участника и собственной групповой активности. */
import { pool } from '../../database/db';
import type { DialogProfileGroup } from '../../../shared/dialog-profile-groups';

/** Членство и сообщения объединяются только по одной паре бот–группа в пределах проекта. */
export const DIALOG_PROFILE_GROUPS_SQL = `WITH memberships AS (
  SELECT DISTINCT ON (bg.group_id,bg.token_id) bg.group_id,bg.token_id,
    gm.status,gm.updated_at
  FROM group_members gm JOIN bot_groups bg ON bg.id=gm.group_id
  WHERE bg.project_id=$1 AND gm.user_id::text=$2 AND bg.group_id IS NOT NULL
    AND COALESCE(bg.chat_type,'group') IN ('group','supergroup')
  ORDER BY bg.group_id,bg.token_id,gm.updated_at DESC NULLS LAST,gm.id DESC
), activity AS (
  SELECT bm.chat_id group_id,bm.token_id,MAX(bm.created_at) last_at,COUNT(*)::integer messages
  FROM bot_messages bm WHERE bm.project_id=$1 AND bm.user_id=$2 AND bm.message_type='user'
    AND bm.chat_type IN ('group','supergroup') AND bm.chat_id IS NOT NULL
  GROUP BY bm.chat_id,bm.token_id
), evidence AS (
  SELECT COALESCE(m.group_id,a.group_id) group_id,COALESCE(m.token_id,a.token_id) token_id,
    m.group_id IS NOT NULL membership_known,m.status,m.updated_at,a.last_at,COALESCE(a.messages,0) messages
  FROM memberships m FULL JOIN activity a ON m.group_id=a.group_id AND m.token_id IS NOT DISTINCT FROM a.token_id
)
SELECT e.group_id AS "groupId",COALESCE(NULLIF(bg.name,''),e.group_id) name,
  COALESCE(bg.chat_type,'group') AS "chatType",e.token_id AS "tokenId",
  COALESCE(NULLIF(t.bot_first_name,''),NULLIF(t.name,'')) AS "botName",t.bot_username AS "botUsername",
  e.membership_known AS "membershipKnown",e.status AS "membershipStatus",e.updated_at AS "membershipCheckedAt",
  e.last_at AS "lastActivityAt",e.messages AS "messageCount"
FROM evidence e LEFT JOIN bot_tokens t ON t.id=e.token_id AND t.project_id=$1
LEFT JOIN LATERAL (SELECT g.name,g.chat_type FROM bot_groups g
  WHERE g.project_id=$1 AND g.group_id=e.group_id AND (g.token_id=e.token_id OR g.token_id IS NULL)
  ORDER BY (g.token_id=e.token_id) DESC NULLS LAST,g.updated_at DESC NULLS LAST,g.id DESC LIMIT 1) bg ON true
ORDER BY COALESCE(e.last_at,e.updated_at) DESC NULLS LAST,e.group_id,e.token_id`;

/**
 * Читает существующие сведения без запроса Telegram и без раскрытия токенов.
 * @param projectId - Разрешённый проект.
 * @param userId - Проверенный Telegram ID пользователя.
 * @returns Группы с раздельными доказательствами членства и активности.
 */
export async function getDialogProfileGroups(projectId: number, userId: string): Promise<DialogProfileGroup[]> {
  return (await pool.query<DialogProfileGroup>(DIALOG_PROFILE_GROUPS_SQL, [projectId, userId])).rows;
}
