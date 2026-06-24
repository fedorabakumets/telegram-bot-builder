/**
 * @fileoverview Нужны ли ноде служебные поля сообщения (порт из client)
 * @module lib/bot-tools/needs-message-defaults
 */

import type { Node } from '@shared/schema';

/** Типы триггеров — без полей сообщения */
const TRIGGER_TYPES = new Set<string>([
  'command_trigger', 'text_trigger', 'incoming_message_trigger', 'group_message_trigger',
  'callback_trigger', 'incoming_callback_trigger', 'outgoing_message_trigger',
  'managed_bot_updated_trigger', 'schedule_trigger', 'userbot_edit_trigger',
]);

/** Management / logic — без полей сообщения */
const MANAGEMENT_TYPES = new Set<string>([
  'pin_message', 'unpin_message', 'delete_message', 'forward_message',
  'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user',
  'promote_user', 'demote_user', 'admin_rights', 'broadcast', 'client_auth',
  'create_forum_topic', 'http_request', 'get_managed_bot_token', 'set_variable',
  'psql_query', 'convert_file', 'loop', 'bot_table', 'delay',
  'userbot_message', 'userbot_click_button', 'userbot_inline_query', 'parallel_split', 'comment',
]);

const NON_MESSAGE_EXTRA = new Set<string>(['condition', 'comment', 'edit_message', 'answer_callback_query']);

/**
 * Проверяет, нужны ли ноде служебные поля сообщения
 * @param type - Тип ноды
 * @returns true если нужны message defaults
 */
export function needsMessageDefaults(type: string): boolean {
  if (TRIGGER_TYPES.has(type)) return false;
  if (MANAGEMENT_TYPES.has(type)) return false;
  if (NON_MESSAGE_EXTRA.has(type)) return false;
  return true;
}

/** Служебные поля сообщения для message-like нод */
const MESSAGE_DEFAULT_FIELDS = {
  oneTimeKeyboard: false,
  resizeKeyboard: true,
  markdown: false,
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  showInMenu: true,
} as const;

/**
 * Подмешивает служебные поля сообщения в data
 * @param type - Тип ноды
 * @param data - Текущие data
 * @returns data с дефолтами
 */
export function applyMessageDefaults(type: string, data: Record<string, unknown>): Record<string, unknown> {
  if (!needsMessageDefaults(type)) return data;
  return { ...MESSAGE_DEFAULT_FIELDS, ...data };
}
