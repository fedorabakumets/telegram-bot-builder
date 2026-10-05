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
] as const;

/** Служебные таблицы: роли bot_runtime права не выдаются */
export const BOT_RUNTIME_DENIED_TABLES = [
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
  "bot_groups",
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
