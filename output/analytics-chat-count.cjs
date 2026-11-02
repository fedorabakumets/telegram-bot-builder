/** @fileoverview Проверяет распределение событий по типам чатов за выбранный день. */
require('dotenv').config({ quiet: true });
const pool = new (require('pg').Pool)({ connectionString: process.env.DATABASE_URL });
const sql = `SELECT kind,chat_type,COUNT(*)::int n FROM (SELECT DISTINCT ON (CASE WHEN kind='message_in' AND chat_type IN ('group','supergroup') THEN 'group:'||COALESCE(chat_id,'')||':'||event_key ELSE 'bot:'||token_id||':'||event_key END) * FROM analytics_events_v2 WHERE project_id=12 AND occurred_at >= '2026-10-31T21:00:00Z' AND occurred_at < '2026-11-01T21:00:00Z' ORDER BY CASE WHEN kind='message_in' AND chat_type IN ('group','supergroup') THEN 'group:'||COALESCE(chat_id,'')||':'||event_key ELSE 'bot:'||token_id||':'||event_key END,directed DESC,id) e GROUP BY kind,chat_type ORDER BY kind,chat_type`;
pool.query(sql).then(result => console.log(JSON.stringify(result.rows))).catch(error => console.error(error.message)).finally(() => pool.end());
