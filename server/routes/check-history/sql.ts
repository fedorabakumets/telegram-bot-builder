/** @fileoverview Общая выборка запусков с агрегатами без секретов и подробных результатов. */
import { historyStateSql } from './state-sql';
/** Одинаковая нормализация потерянных worker применяется к списку и деталям. */
const job = historyStateSql('j'), batch = historyStateSql('b'), bot = historyStateSql('r', 'server_interrupted');
/** Одиночные задачи, входящие в группы, исключены из списка самостоятельных запусков. */
export const CHECK_HISTORY_SQL = `WITH
 job_history AS (SELECT j.*,${job.status} AS history_status,${job.finished} AS history_finished,${job.reason} AS history_reason
   FROM chat_access_check_jobs j WHERE j.project_id=$1),
 batch_history AS (SELECT b.*,${batch.status} AS history_status,${batch.finished} AS history_finished,${batch.reason} AS history_reason
   FROM chat_access_check_batches b WHERE b.project_id=$1),
 bot_history AS (SELECT r.*,${bot.status} AS history_status,${bot.finished} AS history_finished,${bot.reason} AS history_reason
   FROM telegram_bot_check_runs r WHERE r.project_id=$1), runs AS (
 SELECT 'chat-job:'||j.id AS run_id,'private-chats' AS kind,j.project_id,j.history_status AS status,date_trunc('milliseconds',j.created_at) AS created_at,j.started_at,j.history_finished AS finished_at,
   j.project_name,COALESCE(j.token_id,j.historical_token_id) AS scope_token_id,j.token_name AS scope_name,j.token_username AS scope_username,j.history_reason AS failure_reason,
   1::bigint AS bots_total,CASE WHEN j.history_status IN ('completed','failed','cancelled') THEN 1 ELSE 0 END::bigint AS bots_finished,
   j.total_count::bigint,j.processed_count::bigint,j.available_count::bigint,j.kicked_count::bigint,j.deleted_count::bigint,j.error_count::bigint,
   0::bigint AS frozen_count,0::bigint AS invalid_count,0::bigint AS other_count
 FROM job_history j WHERE j.project_id=$1
 AND NOT EXISTS (SELECT 1 FROM batch_history b WHERE b.project_id=$1 AND j.id=ANY(b.job_ids))
 AND ($3::integer IS NULL OR COALESCE(j.token_id,j.historical_token_id)=$3)
 UNION ALL
 SELECT 'chat-batch:'||b.id,'private-chats',b.project_id,b.history_status,date_trunc('milliseconds',b.created_at),b.started_at,b.history_finished,
   b.project_name,NULL::integer,NULL::text,NULL::text,b.history_reason,
   a.bots_total,a.bots_finished,a.total_count,a.processed_count,a.available_count,a.kicked_count,a.deleted_count,a.error_count,
   0::bigint,0::bigint,0::bigint
 FROM batch_history b CROSS JOIN LATERAL (
   SELECT COUNT(*) AS bots_total,COUNT(*) FILTER(WHERE j.history_status IN ('completed','failed','cancelled')) AS bots_finished,
     COALESCE(SUM(j.total_count),0)::bigint AS total_count,COALESCE(SUM(j.processed_count),0)::bigint AS processed_count,
     COALESCE(SUM(j.available_count),0)::bigint AS available_count,COALESCE(SUM(j.kicked_count),0)::bigint AS kicked_count,
     COALESCE(SUM(j.deleted_count),0)::bigint AS deleted_count,COALESCE(SUM(j.error_count),0)::bigint AS error_count
   FROM job_history j WHERE j.project_id=$1 AND j.id=ANY(b.job_ids)
 ) a WHERE b.project_id=$1 AND ($3::integer IS NULL OR EXISTS (
   SELECT 1 FROM job_history j WHERE j.project_id=$1 AND j.id=ANY(b.job_ids) AND COALESCE(j.token_id,j.historical_token_id)=$3))
 UNION ALL
 SELECT 'telegram-bots:'||r.id,'telegram-bots',r.project_id,r.history_status,date_trunc('milliseconds',r.created_at),r.started_at,r.history_finished,
   r.project_name,r.scope_token_id,r.scope_name,(SELECT i.username FROM telegram_bot_check_items i WHERE i.project_id=$1 AND i.run_id=r.id AND i.token_id=r.scope_token_id),r.history_reason,r.total_count::bigint,r.processed_count::bigint,
   r.total_count::bigint,r.processed_count::bigint,r.available_count::bigint,0::bigint,0::bigint,r.error_count::bigint,
   a.frozen_count,a.invalid_count,a.other_count
 FROM bot_history r CROSS JOIN LATERAL (
   SELECT COUNT(*) FILTER(WHERE i.reason='telegram_frozen') AS frozen_count,
     COUNT(*) FILTER(WHERE i.reason='unauthorized') AS invalid_count,
     COUNT(*) FILTER(WHERE i.status='unavailable' AND COALESCE(i.reason,'') NOT IN ('telegram_frozen','unauthorized')) AS other_count
   FROM telegram_bot_check_items i WHERE i.project_id=$1 AND i.run_id=r.id
 ) a WHERE r.project_id=$1 AND ($3::integer IS NULL OR EXISTS (
   SELECT 1 FROM telegram_bot_check_items i WHERE i.project_id=$1 AND i.run_id=r.id AND i.token_id=$3))
) SELECT * FROM runs WHERE ($2::text IS NULL OR kind=$2)
 AND ($4::timestamptz IS NULL OR created_at<$4 OR (created_at=$4 AND run_id<$5::text))
 AND ($6::text IS NULL OR run_id=$6) ORDER BY created_at DESC,run_id DESC LIMIT $7`;
