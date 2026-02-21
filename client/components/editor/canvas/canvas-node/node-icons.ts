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
  message: 'fas fa-comment',
  photo: 'fas fa-image',
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file-alt',
  keyboard: 'fas fa-keyboard',
  command: 'fas fa-terminal',
  sticker: 'fas fa-laugh',
  voice: 'fas fa-microphone',
  animation: 'fas fa-film',
  location: 'fas fa-map-marker-alt',
  contact: 'fas fa-address-book',
  pin_message: 'fas fa-thumbtack',
  unpin_message: 'fas fa-times',
  delete_message: 'fas fa-trash',
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
  broadcast: 'fas fa-bullhorn'
};
