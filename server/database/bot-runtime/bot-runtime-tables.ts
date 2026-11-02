/**
 * @fileoverview Таблицы и sequence роли bot_runtime
 * Список совпадает с docs/futures/infrastructure/bot-database-access.md.
 * @module server/database/bot-runtime/bot-runtime-tables
 */

/** Таблицы, на которые роли выдаются SELECT, INSERT, UPDATE, DELETE */
export const BOT_RUNTIME_TABLES = [
  "bot_users",
  "bot_messages",
  "bot_message_media",
  "media_files",
  "media_file_tokens",
  "bot_tables",
  "bot_table_columns",
  "bot_table_rows",
  "message_activity_daily",
  "user_activity_daily",
  "schedule_state",
  "bot_groups",
  "chat_access",
] as const;

/**
 * Таблицы с собственными project_id и token_id.
 * Политика сравнивает обе колонки с app.project_id и app.token_id.
 */
export const BOT_RUNTIME_DIRECT_TABLES = [
  "bot_users",
  "bot_messages",
  "message_activity_daily",
  "user_activity_daily",
  "schedule_state",
  "bot_groups",
  "chat_access",
] as const;

/**
 * Таблицы только с project_id.
 * token_id в строке нет: политика требует, чтобы оба setting были заданы,
 * и сравнивает project_id.
 */
export const BOT_RUNTIME_PROJECT_TABLES = ["media_files", "bot_tables"] as const;

/** Sequence, на которые роли выдаются USAGE и SELECT */
export const BOT_RUNTIME_SEQUENCES = [
  "bot_messages_id_seq",
  "bot_message_media_id_seq",
  "media_files_id_seq",
  "media_file_tokens_id_seq",
  "bot_tables_id_seq",
  "bot_table_columns_id_seq",
  "bot_table_rows_id_seq",
  "schedule_state_id_seq",
  "bot_groups_id_seq",
] as const;

/** Служебные таблицы: роли bot_runtime права не выдаются */
export const BOT_RUNTIME_DENIED_TABLES = [
  "analytics_events_v2",
  "analytics_audience_v2",
  "analytics_legacy_people_v2",
  "analytics_person_deletions_v2",
  "analytics_audience_evidence_v2",
  "analytics_evidence_backfill_v2",
  "analytics_start_observations_v2",
  "analytics_start_observation_backfill_v2",
  "analytics_runtime_v2",
  "analytics_daily_v2",
  "analytics_versions_v2",
  "analytics_outbox_v2",
  "analytics_sources",
  "analytics_placements",
  "analytics_links",
  "analytics_expenses",
  "analytics_acquisition_audit",
  "telegram_users",
  "session",
  "app_settings",
  "bot_projects",
  "project_collaborators",
  "bot_tokens",
  "bot_env_variables",
  "bot_instances",
  "bot_launch_history",
  "bot_logs",
  "group_members",
  "bot_templates",
  "broadcasts",
  "broadcast_results",
  "broadcast_campaigns",
  "project_versions",
  "storage_configs",
  "agent_tokens",
  "bot_builds",
  "worker_processes",
  "user_project_archives",
  "user_telegram_settings",
] as const;

/** Узкие операции новой аналитики, доступные runtime без прямых прав на таблицы. */
export const BOT_RUNTIME_ANALYTICS_FUNCTIONS = [
  'mark_analytics_runtime_v2(integer,integer)',
  'record_analytics_event_v2(jsonb)',
  'analytics_resolve_link_v2(integer,integer,text)',
] as const;
