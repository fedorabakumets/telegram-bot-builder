/** @fileoverview Пакетные счётчики сохранённых сообщений и нажатий для страницы пользователей. */
import { userSourceFallback } from '../../../shared/user-source-fallback';
import { sourceLabelSql } from './user-directory-sql';
import { pool } from '../../database/db';
import type { UserBotData } from '@shared/schema';
import { userBotMemberships } from './user-bot-memberships';

/**
 * Считает действия только для пользователей текущей страницы в разрешённом проекте.
 * @param projectId - Проект после проверки доступа.
 * @param tokenId - Выбранный бот либо все боты проекта.
 * @param users - Страница пользователей.
 * @returns Страница с раздельными счётчиками входящих действий.
 */
export async function enrichUserMetrics(projectId: number, tokenId: number | null, users: UserBotData[]) {
  if (!users.length) return users;
  /** Классификация совпадает с личными сообщениями графика аналитики v2. */
  const result = await pool.query(`WITH actions AS (SELECT user_id,kind
    FROM analytics_events_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
      AND user_id=ANY($3::text[]) AND chat_type='private' AND occurred_at<CURRENT_TIMESTAMP
    UNION ALL SELECT user_id,'callback' FROM analytics_audience_evidence_v2
      WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2) AND user_id=ANY($3::text[])
      AND chat_type='private' AND reason='legacy_callback' AND observed_at<CURRENT_TIMESTAMP)
    SELECT user_id,
    COUNT(*) FILTER (WHERE kind='callback')::integer AS clicks,
    COUNT(*) FILTER (WHERE kind='message_in')::integer AS messages
    FROM actions GROUP BY user_id`,
  [projectId, tokenId, users.map(user => user.userId)]);
  const counts = new Map(result.rows.map(row => [row.user_id, row]));
  /** Источник первого обращения берётся из той же атрибуции, что и аналитика. */
  const sources = await pool.query(`SELECT DISTINCT ON(a.user_id) a.user_id,${sourceLabelSql} label FROM analytics_audience_v2 a
    LEFT JOIN analytics_sources s ON s.project_id=a.project_id AND s.id=a.source_id
    WHERE a.project_id=$1 AND ($2::integer IS NULL OR a.token_id=$2) AND a.user_id=ANY($3::text[])
    AND a.first_interaction_at<=CURRENT_TIMESTAMP
    ORDER BY a.user_id,a.first_interaction_at,a.first_known,a.first_event_id,a.token_id`, [projectId, tokenId, users.map(user => user.userId)]);
  const origins = new Map(sources.rows.map(row => [row.user_id, row.label]));
  const memberships = await userBotMemberships(projectId, tokenId, users.map(user => user.userId));
  return users.map(user => ({ ...user, botMemberships: memberships.get(user.userId) ?? [], incomingMessageCount: counts.get(user.userId)?.messages ?? 0,
    buttonClickCount: counts.get(user.userId)?.clicks ?? 0, acquisitionSource: origins.get(user.userId) ?? user.acquisitionSource ?? userSourceFallback(user.deepLinkParam, user.referrerId) }));
}
