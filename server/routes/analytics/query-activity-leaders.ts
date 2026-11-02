/** @fileoverview Рейтинги активности из сохранённых входящих записей без объединения разных Telegram ID. */
import type { PoolClient } from 'pg';

/**
 * Формирует оба рейтинга одним оператором и снимком времени, обогащая имена после подсчёта.
 * @param client - Соединение с базой.
 * @param projectId - Авторизованный проект.
 * @param tokenId - Выбранный бот либо весь проект.
 * @param window - Проверенное окно периода.
 * @param asOf - Общая исключённая верхняя граница.
 * @returns Пользователи и группы с раздельными действиями.
 */
export async function queryActivityLeaders(client: Pick<PoolClient, 'query'>, projectId: number,
  tokenId: number | null, window: string, asOf: string) {
  const result = await client.query(`WITH events AS (
    SELECT user_id, chat_id, chat_type, created_at,
      CASE WHEN message_data->>'button_clicked' = 'true' THEN 1 ELSE 0 END AS clicks
    FROM bot_messages WHERE project_id = $1 AND ($2::integer IS NULL OR token_id = $2)
      AND message_type = 'user' AND created_at >= $4::timestamptz - $3::interval AND created_at < $4::timestamptz
  ), users AS (
    SELECT user_id AS id, COUNT(*)::integer AS total, SUM(1-clicks)::integer AS messages,
      SUM(clicks)::integer AS clicks, MAX(created_at) AS last_activity
    FROM events WHERE user_id ~ '^[1-9][0-9]*$' GROUP BY user_id ORDER BY total DESC, user_id LIMIT 10
  ), groups AS (
    SELECT chat_id AS id, COUNT(*)::integer AS total, SUM(1-clicks)::integer AS messages,
      SUM(clicks)::integer AS clicks, MAX(created_at) AS last_activity
    FROM events WHERE chat_type IN ('group','supergroup') AND NULLIF(chat_id,'') IS NOT NULL
    GROUP BY chat_id ORDER BY total DESC, chat_id LIMIT 10
  ), named_users AS (
    SELECT u.*, COALESCE(NULLIF(CONCAT_WS(' ',p.first_name,p.last_name),''), NULLIF(p.username,''), 'Пользователь ' || u.id) AS name,
      p.username FROM users u LEFT JOIN LATERAL (
      SELECT first_name,last_name,username FROM bot_users WHERE project_id=$1 AND user_id::text=u.id
      AND ($2::integer IS NULL OR token_id=$2) ORDER BY last_interaction DESC NULLS LAST,token_id LIMIT 1
    ) p ON true
  ), named_groups AS (
    SELECT g.*, COALESCE(NULLIF(p.name,''),'Группа ' || g.id) AS name FROM groups g LEFT JOIN LATERAL (
      SELECT name FROM bot_groups WHERE project_id=$1 AND group_id=g.id AND ($2::integer IS NULL OR token_id=$2)
      AND chat_type IN ('group','supergroup') ORDER BY updated_at DESC NULLS LAST,id DESC LIMIT 1
    ) p ON true
  ) SELECT COALESCE((SELECT json_agg(named_users ORDER BY total DESC,id) FROM named_users),'[]') AS users,
    COALESCE((SELECT json_agg(named_groups ORDER BY total DESC,id) FROM named_groups),'[]') AS groups`,
  [projectId, tokenId, window, asOf]);
  return result.rows[0];
}
