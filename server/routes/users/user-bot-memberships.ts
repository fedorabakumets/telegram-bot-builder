/** @fileoverview Пакетная загрузка связей пользователей с ботами в разрешённой области проекта. */
import { userContactOriginSql, firstSavedMessageSql } from './user-contact-origin-sql';
import { userSourceFallbackSql } from './user-source-fallback-sql';
import { pool } from '../../database/db';
import type { UserBotMembership } from '@shared/user-bot-membership';
import { sourceLabelSql } from './user-directory-sql';
import { botAvailabilityLabel } from '@shared/bot-availability-label';
import { userContactEligibility } from './user-contact-eligibility';
/**
 * Загружает ботов и отдельные переменные только для текущей страницы личных контактов.
 * @param projectId - Проверенный проект.
 * @param tokenId - Выбранный бот либо все боты проекта.
 * @param userIds - Telegram ID текущей страницы.
 * @returns Связи, сгруппированные по пользователю.
 */
export async function userBotMemberships(projectId: number, tokenId: number | null, userIds: string[]) {
  if (!userIds.length) return new Map<string, UserBotMembership[]>();
  const result = await pool.query(`WITH actions AS (
    SELECT user_id,token_id,kind FROM analytics_events_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
      AND user_id=ANY($3::text[]) AND chat_type='private' AND occurred_at<CURRENT_TIMESTAMP
    UNION ALL SELECT user_id,token_id,'callback' FROM analytics_audience_evidence_v2
      WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2) AND user_id=ANY($3::text[])
        AND chat_type='private' AND reason='legacy_callback' AND observed_at<CURRENT_TIMESTAMP
  ), counts AS (SELECT user_id,token_id,COUNT(*) FILTER(WHERE kind='message_in') messages,
    COUNT(*) FILTER(WHERE kind='callback') clicks FROM actions GROUP BY user_id,token_id)
    SELECT b.user_id::text user_id,
    jsonb_agg(jsonb_build_object('tokenId',b.token_id,'name',COALESCE(NULLIF(t.bot_first_name,''),NULLIF(t.name,''),'Бот '||b.token_id),
      'contactOrigin',${userContactOriginSql('b')},'firstSavedMessageAt',${firstSavedMessageSql('b')},
      'username',t.bot_username,'userData',b.user_data,'incomingMessageCount',COALESCE(c.messages,0),
      'deepLinkParam',b.deep_link_param,'referrerId',b.referrer_id,
      'importedAt',b.imported_at,'hasPrivateMessages',EXISTS(SELECT 1 FROM bot_messages pm
        WHERE pm.project_id=b.project_id AND pm.token_id=b.token_id AND pm.user_id=b.user_id::text AND COALESCE(pm.chat_type,'private')='private'),
      'authorizationError',t.authorization_error,'botActive',t.is_active,
      'buttonClickCount',COALESCE(c.clicks,0),'lastInteraction',b.last_interaction,'acquisitionSource',COALESCE(origin.label,${userSourceFallbackSql('b')}),
      'isActive',COALESCE(b.is_active,0)=1,'isBlocked',COALESCE(b.is_blocked,0)=1,'isDeleted',COALESCE(b.is_deleted,0)=1,
      'status',CASE WHEN b.is_deleted=1 THEN 'Аккаунт удалён'
      WHEN b.is_blocked=1 THEN 'Пользователь заблокировал бота' WHEN b.is_active=1 THEN 'Активен' ELSE 'Неактивен' END)
      ORDER BY COALESCE(t.bot_username,t.name),b.token_id) memberships
    FROM bot_users b JOIN bot_tokens t ON t.id=b.token_id AND t.project_id=b.project_id
    LEFT JOIN counts c ON c.user_id=b.user_id::text AND c.token_id=b.token_id
    LEFT JOIN LATERAL (SELECT ${sourceLabelSql} label FROM analytics_audience_v2 a
      LEFT JOIN analytics_sources s ON s.project_id=a.project_id AND s.id=a.source_id
      WHERE a.project_id=b.project_id AND a.token_id=b.token_id AND a.user_id=b.user_id::text
      AND a.first_interaction_at<=CURRENT_TIMESTAMP
      ORDER BY a.first_interaction_at,a.first_known,a.first_event_id,a.token_id LIMIT 1) origin ON true
    WHERE b.project_id=$1 AND ($2::integer IS NULL OR b.token_id=$2) AND b.user_id::text=ANY($3::text[])
      AND b.is_bot=0 AND ${userContactEligibility('b')}
    GROUP BY b.user_id`, [projectId, tokenId, userIds]);
  return new Map<string, UserBotMembership[]>(result.rows.map(row => [row.user_id,
    row.memberships.map((bot: UserBotMembership & { /** Ошибка токена. */ authorizationError: string | null; /** Активность бота. */ botActive: number | null }) => {
      const { authorizationError, botActive, ...membership } = bot;
      return { ...membership, botAvailability: botAvailabilityLabel(authorizationError, botActive) };
    })]));
}
