/**
 * @fileoverview Белый список типов нод для MCP (как в палитре конструктора)
 * @description Источник: client/components/editor/sidebar/constants.ts → componentCategories
 * @module lib/bot-tools/mcp-allowed-types
 */

import type { NodeTypeInfo } from './types.ts';

/** Типы, доступные в MCP — совпадают с палитрой сайдбара редактора */
export const MCP_ALLOWED_NODE_TYPES = [
  'command_trigger',
  'text_trigger',
  'incoming_message_trigger',
  'outgoing_message_trigger',
  'message',
  'media',
  'input',
  'edit_message',
  'delete_message',
  'forward_message',
  'callback_trigger',
  'incoming_callback_trigger',
  'keyboard',
  'answer_callback_query',
  'group_message_trigger',
  'create_forum_topic',
  'kick_user',
  'schedule_trigger',
  'http_request',
  'psql_query',
  'bot_table',
  'convert_file',
  'condition',
  'set_variable',
  'loop',
  'delay',
  'parallel_split',
  'userbot_message',
  'userbot_click_button',
  'userbot_inline_query',
  'userbot_edit_trigger',
  'comment',
] as const;

/** Legacy и типы вне палитры — запрещены для create_node / list_node_types */
export const MCP_FORBIDDEN_NODE_TYPES = [
  'start',
  'command',
  'photo',
  'video',
  'audio',
  'document',
  'animation',
  'sticker',
  'voice',
  'location',
  'contact',
  'pin_message',
  'unpin_message',
  'ban_user',
  'unban_user',
  'mute_user',
  'unmute_user',
  'promote_user',
  'demote_user',
  'admin_rights',
  'broadcast',
  'client_auth',
  'get_managed_bot_token',
  'managed_bot_updated_trigger',
] as const;

/** Описания для list_node_types */
const MCP_NODE_DESCRIPTIONS: Record<string, string> = {
  command_trigger: 'Триггер на команду /start, /help и др.',
  text_trigger: 'Триггер на текст сообщения или синоним',
  incoming_message_trigger: 'Триггер на любое входящее сообщение',
  outgoing_message_trigger: 'Триггер на исходящее сообщение',
  message: 'Текстовое сообщение пользователю',
  media: 'Медиа (фото, видео, аудио, документ)',
  input: 'Сбор ответа пользователя в переменную',
  edit_message: 'Редактирование сообщения',
  delete_message: 'Удаление сообщений',
  forward_message: 'Пересылка сообщения',
  callback_trigger: 'Триггер на callback-кнопку',
  incoming_callback_trigger: 'Триггер на входящий callback',
  keyboard: 'Клавиатура (reply/inline)',
  answer_callback_query: 'Ответ на callback_query',
  group_message_trigger: 'Триггер на сообщение в группе',
  create_forum_topic: 'Создание топика форума',
  kick_user: 'Исключение пользователя из чата',
  schedule_trigger: 'Запуск по расписанию',
  http_request: 'HTTP-запрос к API',
  psql_query: 'SQL-запрос к PostgreSQL',
  bot_table: 'Операции с таблицей бота',
  convert_file: 'Конвертация файла',
  condition: 'Ветвление по переменной (branches + else)',
  set_variable: 'Присвоение переменных',
  loop: 'Цикл по массиву',
  delay: 'Задержка',
  parallel_split: 'Параллельный запуск веток',
  userbot_message: 'Сообщение через юзербот (Telethon)',
  userbot_click_button: 'Нажатие кнопки через юзербот',
  userbot_inline_query: 'Inline-запрос через юзербот',
  userbot_edit_trigger: 'Триггер на редактирование (юзербот)',
  comment: 'Комментарий на холсте',
};

/**
 * Проверяет, разрешён ли тип для MCP-конструирования
 * @param type - Тип ноды
 * @returns true если тип в белом списке палитры
 */
export function isMcpAllowedNodeType(type: string): type is typeof MCP_ALLOWED_NODE_TYPES[number] {
  return (MCP_ALLOWED_NODE_TYPES as readonly string[]).includes(type);
}

/**
 * Список типов для MCP list_node_types
 * @returns Массив NodeTypeInfo только из палитры UI
 */
export function buildMcpNodeTypeList(): NodeTypeInfo[] {
  return MCP_ALLOWED_NODE_TYPES.map((type) => ({
    type,
    description: MCP_NODE_DESCRIPTIONS[type] ?? `Тип ноды: ${type}`,
  }));
}

/**
 * Подсказка по запрещённым типам для ИИ
 * @returns Объект с forbidden и replacements
 */
export function getMcpForbiddenTypesHint() {
  return {
    forbidden: [...MCP_FORBIDDEN_NODE_TYPES],
    replacements: {
      start: 'command_trigger + message',
      command: 'command_trigger + message',
      photo: 'media',
      video: 'media',
      audio: 'media',
      document: 'media',
      animation: 'media',
      sticker: 'media',
      voice: 'media',
    },
    note: 'MCP создаёт только типы из палитры конструктора. Legacy-проекты с start/command всё ещё проходят validate_bot_project.',
  };
}
