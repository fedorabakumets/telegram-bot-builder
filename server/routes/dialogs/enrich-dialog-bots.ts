/** @fileoverview Боты с реальной личной перепиской для общего списка диалогов. */
import { pool } from '../../database/db';
import { botAvailabilityLabel } from '../../../shared/bot-availability-label';
import type { UserBotMembership } from '../../../shared/user-bot-membership';

/** Строка пакетного результата с данными доступности бота. */
interface DialogBotRow {
  /** Telegram ID собеседника. */ userId: string;
  /** Сведения о пользователе в конкретном боте. */ membership: UserBotMembership;
  /** Сохранённая ошибка Telegram. */ authorizationError: string | null;
  /** Признак включения бота. */ botActive: number | null;
}

/**
 * Дополняет личные строки только ботами с сохранённой историей сообщений.
 * @param projectId - Проект после проверки доступа.
 * @param entries - Текущая страница общего списка.
 * @returns Диалоги с отдельными состояниями каждого бота; группы остаются неизменными.
 */
export async function enrichDialogBotMemberships<T extends { userId: string; isGroup?: boolean }>(
  projectId: number, entries: T[],
): Promise<Array<T & { botMemberships?: UserBotMembership[] }>> {
  const userIds = [...new Set(entries.filter(entry => !entry.isGroup && /^[1-9]\d*$/.test(String(entry.userId)))
    .map(entry => String(entry.userId)))];
  if (!userIds.length) return entries;
  /** История ограничена проектом и людьми страницы, без импортированных связей без переписки. */
  const result = await pool.query<DialogBotRow>(`WITH history AS (
    SELECT m.user_id,m.token_id,MIN(m.created_at) first_at,MAX(m.created_at) last_at
    FROM bot_messages m WHERE m.project_id=$1 AND m.user_id=ANY($2::text[])
      AND COALESCE(m.chat_type,'private')='private'
    GROUP BY m.user_id,m.token_id
  ), actions AS (
    SELECT user_id,token_id,kind FROM analytics_events_v2
    WHERE project_id=$1 AND user_id=ANY($2::text[]) AND chat_type='private' AND occurred_at<CURRENT_TIMESTAMP
    UNION ALL SELECT user_id,token_id,'callback' FROM analytics_audience_evidence_v2
    WHERE project_id=$1 AND user_id=ANY($2::text[]) AND chat_type='private'
      AND reason='legacy_callback' AND observed_at<CURRENT_TIMESTAMP
  ), counts AS (
    SELECT user_id,token_id,COUNT(*) FILTER(WHERE kind='message_in') messages,
      COUNT(*) FILTER(WHERE kind='callback') clicks FROM actions GROUP BY user_id,token_id
  ) SELECT h.user_id AS "userId",t.authorization_error AS "authorizationError",t.is_active AS "botActive",
    jsonb_build_object('tokenId',h.token_id,'name',COALESCE(NULLIF(t.bot_first_name,''),NULLIF(t.name,''),'Бот '||t.id),
      'username',t.bot_username,'userData',u.user_data,'contactOrigin','private','hasPrivateMessages',true,
      'firstSavedMessageAt',h.first_at,'lastInteraction',h.last_at,'acquisitionSource','Источник не сохранён',
      'incomingMessageCount',COALESCE(c.messages,0),'buttonClickCount',COALESCE(c.clicks,0),
      'isActive',COALESCE(u.is_active,0)=1,'isBlocked',COALESCE(u.is_blocked,0)=1,'isDeleted',COALESCE(u.is_deleted,0)=1,
      'status',CASE WHEN u.is_deleted=1 THEN 'Аккаунт удалён' WHEN u.is_blocked=1 THEN 'Пользователь заблокировал бота'
        WHEN u.is_active=1 THEN 'Активен' ELSE 'Неактивен' END) membership
    FROM history h JOIN bot_tokens t ON t.id=h.token_id AND t.project_id=$1
    LEFT JOIN bot_users u ON u.project_id=$1 AND u.token_id=h.token_id AND u.user_id::text=h.user_id
    LEFT JOIN counts c ON c.user_id=h.user_id AND c.token_id=h.token_id
    ORDER BY h.last_at DESC NULLS LAST,h.token_id`, [projectId, userIds]);
  const memberships = new Map<string, UserBotMembership[]>();
  for (const row of result.rows) {
    const bots = memberships.get(row.userId) ?? [];
    bots.push({ ...row.membership, botAvailability: botAvailabilityLabel(row.authorizationError, row.botActive) });
    memberships.set(row.userId, bots);
  }
  return entries.map(entry => entry.isGroup ? entry : { ...entry, botMemberships: memberships.get(String(entry.userId)) ?? [] });
}
