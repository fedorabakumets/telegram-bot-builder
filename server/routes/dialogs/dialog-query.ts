/** @fileoverview Изолированная по токену выборка личных и групповых диалогов. */

/** SQL выборки до поиска и пагинации; параметры $1 и $2 — проект и токен. */
export const DIALOG_QUERY = `WITH messages AS (
  SELECT *, CASE WHEN COALESCE(chat_type, 'private') = 'private' THEN user_id ELSE chat_id END AS dialog_id,
    COALESCE(chat_type, 'private') AS kind
  FROM bot_messages WHERE project_id = $1 AND token_id = $2
), history AS (
  SELECT dialog_id, kind, COUNT(*)::integer AS retained_message_count,
    MAX(created_at) AS message_at FROM messages WHERE dialog_id IS NOT NULL GROUP BY dialog_id, kind
), latest AS (
  SELECT DISTINCT ON (dialog_id, kind) dialog_id, kind, message_text, message_type, created_at
  FROM messages ORDER BY dialog_id, kind, created_at DESC NULLS LAST, id DESC
), identities AS (
  SELECT u.user_id::text AS chat_id, 'private'::text AS chat_type,
    NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '') AS title,
    u.username AS username, ph.message_at AS activity, NULL::text AS avatar_url
  FROM bot_users u JOIN history ph ON ph.dialog_id = u.user_id::text AND ph.kind = 'private'
  WHERE u.project_id = $1 AND u.token_id = $2 AND COALESCE(u.is_bot, 0) = 0
  UNION ALL
  SELECT h.dialog_id, h.kind, NULLIF(bg.name, h.dialog_id),
    CASE WHEN bg.url LIKE 'https://t.me/%' THEN SUBSTRING(bg.url FROM 14) ELSE NULL END,
    h.message_at, bg.avatar_url
  FROM history h LEFT JOIN LATERAL (
    SELECT name, url, avatar_url FROM bot_groups
    WHERE project_id = $1 AND token_id = $2 AND group_id = h.dialog_id
    ORDER BY id DESC LIMIT 1
  ) bg ON TRUE WHERE h.kind IN ('group', 'supergroup', 'channel')
), dialogs AS (
  SELECT i.chat_id, i.chat_type, i.title, COALESCE(i.title, i.chat_id) AS display_name,
    i.username, date_trunc('milliseconds', i.activity) AS last_activity_at,
    COALESCE(h.retained_message_count, 0) AS retained_message_count,
    CASE WHEN l.dialog_id IS NULL THEN NULL ELSE jsonb_build_object(
      'preview', LEFT(COALESCE(l.message_text, '[медиа]'), 200),
      'direction', CASE WHEN l.message_type = 'user' THEN 'incoming' ELSE 'outgoing' END,
      'created_at', l.created_at) END AS last_message,
    COALESCE(a.status, 'unknown') AS access_status, a.checked_at AS access_checked_at
  FROM identities i LEFT JOIN history h ON h.dialog_id = i.chat_id AND h.kind = i.chat_type
  LEFT JOIN latest l ON l.dialog_id = i.chat_id AND l.kind = i.chat_type
  LEFT JOIN chat_access a ON a.project_id = $1 AND a.token_id = $2
    AND a.chat_id = i.chat_id
) SELECT * FROM dialogs`;
