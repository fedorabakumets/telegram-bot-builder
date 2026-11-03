/** @fileoverview Явная классификация эффектов существующих MCP-действий и контракт новых регистраций. */

/** Эффект операции без вывода по префиксу имени инструмента. */
export type McpActionEffect = 'read' | 'prepare' | 'write' | 'file' | 'external' | 'unknown';
/** Политика одного действия. */
export interface McpActionPolicy {
  /** Раздел по назначению действия. */
  section: string;
  /** Основной эффект операции. */
  effect: McpActionEffect;
  /** Удаление или другое разрушительное изменение. */
  destructive: boolean;
  /** Нужна ли отдельная проверка применения настроек работающим ботом. */
  runtimeApply: 'not_applicable' | 'separate';
  /** Запуск фоновой работы не означает её завершение. */
  completionMode: 'immediate' | 'job';
  /** Действие чтения результата фоновой работы. */
  pollAction?: string;
}

/** Явные связи запуска с наблюдением, без угадывания по подстроке имени. */
const JOBS = new Map([
  ['db_start_bot', 'db_bot_status'], ['db_restart_bot', 'db_bot_status'],
  ['db_start_offline_bots', 'db_bot_status'], ['db_restart_all_bots', 'db_bot_status'],
  ['db_start_chat_access_check', 'db_get_chat_access_check'], ['db_start_broadcast', 'db_get_broadcast'],
]);

/** Явные назначения старых операций; новые регистрации передают такую же политику через _meta.botcraft. */
const POLICIES = new Map<string, McpActionPolicy>();

/**
 * Назначает проверенную группу действий, не анализируя подстроки их имён.
 * @param section - Раздел каталога.
 * @param effect - Основной эффект.
 * @param names - Полный список имён через пробел.
 */
function group(section: string, effect: McpActionEffect, names: string): void {
  for (const name of names.split(/\s+/).filter(Boolean)) {
    if (POLICIES.has(name)) throw new Error(`Повторное назначение политики ${name}`);
    POLICIES.set(name, { section, effect, destructive: false, completionMode: JOBS.has(name) ? 'job' : 'immediate',
      ...(JOBS.has(name) ? { pollAction: JOBS.get(name) } : {}),
      runtimeApply: effect === 'write' && ['scenario', 'sheets', 'settings'].includes(section) ? 'separate' : 'not_applicable' });
  }
}

group('reference', 'read', 'list_node_types list_operators list_commands get_node_schema get_node_example get_prompt_guide get_node_docs get_rule_docs get_tool_docs get_workflow_docs search_docs search_tool_docs');
group('scenario', 'read', 'validate_bot_project validate_node get_project_db db_get_node db_list_nodes db_find_nodes db_list_connections db_find_inbound db_report_button_navigation');
group('scenario', 'prepare', 'create_node scaffold_minimal_project add_node update_node remove_node connect_nodes generate_bot_code');
group('scenario', 'write', 'update_project_db db_add_node db_update_node db_remove_node db_connect_nodes db_disconnect_nodes db_duplicate_node db_move_node db_auto_layout db_apply_ops db_rewrite_button_navigation');
group('sheets', 'read', 'db_list_sheets');
group('sheets', 'write', 'db_add_sheet db_duplicate_sheet db_rename_sheet db_remove_sheet db_set_active_sheet db_reorder_sheets db_move_sheet_to_project');
group('projects', 'read', 'db_list_projects db_project_summary');
group('projects', 'write', 'db_create_project db_duplicate_project db_archive_project db_unarchive_project db_rename_project db_reorder_projects db_delete_project');
group('projects', 'file', 'db_export_project load_project save_project');
group('versions', 'read', 'db_list_versions');
group('versions', 'write', 'db_restore_version db_delete_version db_prune_versions');
group('runtime', 'read', 'db_list_bot_tokens db_bot_status');
group('runtime', 'external', 'db_add_bot_token db_update_bot_token db_delete_bot_token db_start_bot db_stop_bot db_restart_bot db_restart_all_bots db_start_offline_bots');
group('settings', 'write', 'db_set_messages_retention db_set_userbot_settings');
group('settings', 'external', 'db_userbot_send_code db_userbot_sign_in db_userbot_sign_in_2fa');
group('logs', 'read', 'db_bot_logs db_bot_launch_history db_list_bot_launches db_get_launch_logs db_search_bot_logs');
group('logs', 'file', 'db_export_bot_logs');
group('dialogs', 'read', 'db_list_dialogs db_get_dialog_messages db_search_dialog_messages db_get_chat_access_check');
group('dialogs', 'external', 'db_check_chat_access db_start_chat_access_check');
group('analytics', 'read', 'db_get_analytics_v2 db_get_analytics_range db_compare_analytics db_get_acquisition_report db_get_analytics_exchange_rate db_get_analytics_history db_get_active_users_chart db_get_active_users_summary db_get_groups_chart db_get_groups_summary db_get_messages_chart db_get_messages_summary db_get_popular_buttons db_get_traffic_sources_chart db_get_traffic_sources_summary db_get_users_chart db_get_users_languages db_get_users_premium db_get_users_summary db_list_unavailable_users');
for (const [plural, singular] of [['sources', 'source'], ['placements', 'placement'], ['links', 'link'], ['expenses', 'expense']]) {
  group('analytics', 'read', `db_list_analytics_${plural}`);
  group('analytics', 'write', `db_create_analytics_${singular} db_update_analytics_${singular}`);
}
group('tables', 'read', 'db_list_tables db_find_tables db_get_table db_list_table_columns db_list_table_rows db_get_table_row db_find_table_rows db_count_table_rows db_get_table_summary db_get_table_chart db_suggest_table_chart');
group('tables', 'write', 'db_create_table db_rename_table db_delete_table db_add_table_column db_rename_table_column db_delete_table_column db_reorder_table_columns db_add_table_rows db_update_table_row db_patch_table_row db_delete_table_row db_reindex_table_rows db_clear_table_rows db_import_table_rows db_apply_table_ops');
group('tables', 'file', 'db_import_table_file db_export_table db_export_project_tables db_import_project_tables');

/** Разрушительность отмечается независимо от остальных эффектов и названия. */
for (const id of ['db_delete_project', 'db_delete_bot_token', 'db_delete_version', 'db_prune_versions',
  'db_remove_node', 'db_remove_sheet', 'db_delete_table', 'db_delete_table_column', 'db_delete_table_row',
  'db_clear_table_rows', 'db_import_table_rows', 'db_apply_table_ops', 'db_stop_bot', 'db_restart_all_bots']) {
  const policy = POLICIES.get(id);
  if (policy) policy.destructive = true;
}

/**
 * Выбирает явную политику регистрации или проверенное назначение старого инструмента.
 * @param id - Стабильное имя действия.
 * @param meta - Метаданные регистрации SDK.
 * @returns Политика; неизвестные действия явно требуют классификации.
 */
export function getMcpActionPolicy(id: string, meta?: Record<string, unknown>): McpActionPolicy {
  const explicit = meta?.botcraft as Partial<McpActionPolicy> | undefined;
  if (explicit && typeof explicit.section === 'string' && ['read', 'prepare', 'write', 'file', 'external'].includes(String(explicit.effect))) {
    return { section: explicit.section, effect: explicit.effect as McpActionEffect,
      completionMode: JOBS.has(id) || explicit.completionMode === 'job' ? 'job' : 'immediate',
      ...(JOBS.has(id) ? { pollAction: JOBS.get(id) } : explicit.pollAction ? { pollAction: explicit.pollAction } : {}),
      destructive: explicit.destructive === true,
      runtimeApply: explicit.runtimeApply === 'separate' || explicit.effect === 'write'
        && ['settings', 'bots', 'scenario', 'sheets'].includes(explicit.section) ? 'separate' : 'not_applicable' };
  }
  return { ...(POLICIES.get(id) ?? { section: 'unclassified', effect: 'unknown', destructive: false, runtimeApply: 'not_applicable', completionMode: 'immediate' }) };
}
