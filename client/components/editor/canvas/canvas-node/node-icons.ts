/**
 * @fileoverview Константы иконок для различных типов узлов
 * 
 * Содержит сопоставление типов узлов с иконками FontAwesome.
 */

/**
 * Иконки для различных типов узлов
 *
 * @description Объект, сопоставляющий типы узлов с соответствующими им иконками
 */
export const nodeIcons: Record<string, string> = {
  start: 'fas fa-play',
  command: 'fas fa-terminal',
  message: 'fas fa-comment',
  photo: 'fas fa-image',
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file-alt',
  keyboard: 'fas fa-keyboard',
  sticker: 'fas fa-laugh',
  voice: 'fas fa-microphone',
  animation: 'fas fa-film',
  location: 'fas fa-map-marker-alt',
  contact: 'fas fa-address-book',
  pin_message: 'fas fa-thumbtack',
  unpin_message: 'fas fa-times',
  delete_message: 'fas fa-trash',
  forward_message: 'fas fa-share',
  /** Иконка узла создания топика форум-группы */
  create_forum_topic: 'fas fa-layer-group',
  ban_user: 'fas fa-ban',
  unban_user: 'fas fa-user-check',
  mute_user: 'fas fa-volume-mute',
  unmute_user: 'fas fa-volume-up',
  kick_user: 'fas fa-user-times',
  promote_user: 'fas fa-crown',
  demote_user: 'fas fa-user-minus',
  admin_rights: 'fas fa-user-shield',
  input: 'fas fa-edit',
  condition: 'fas fa-code-branch',
  broadcast: 'fas fa-bullhorn',
  client_auth: 'fas fa-user-shield',
  command_trigger: 'fas fa-bolt',
  text_trigger: 'fas fa-comment-dots',
  /** Иконка триггера входящего сообщения */
  incoming_message_trigger: 'fas fa-inbox',
  /** Иконка триггера входящего callback_query */
  incoming_callback_trigger: 'fas fa-hand-pointer',
  /** Иконка триггера исходящего сообщения */
  outgoing_message_trigger: 'fas fa-paper-plane',
  /** Иконка триггера сообщения в группе */
  group_message_trigger: 'fas fa-comments',
  /** Иконка триггера inline-кнопки */
  callback_trigger: 'fas fa-hand-pointer',
  media: 'fas fa-photo-video',
  /** Иконка узла HTTP запроса */
  http_request: 'fas fa-globe',
  /** Иконка триггера обновления управляемого бота (Bot API 9.6) */
  managed_bot_updated_trigger: 'fas fa-robot',
  /** Иконка узла получения токена управляемого бота */
  get_managed_bot_token: 'fas fa-key',
  /** Иконка узла ответа на callback_query */
  answer_callback_query: 'fas fa-bell',
};
