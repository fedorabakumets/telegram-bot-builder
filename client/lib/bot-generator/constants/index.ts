/**
 * @fileoverview Главный экспорт констант генератора ботов
 * 
 * Модуль агрегирует и переэкспортирует все константы.
 * Используется для централизованного импорта констант.
 * 
 * @module bot-generator/constants/index
 */

// Типы узлов
export {
  START,
  MESSAGE,
  COMMAND,
  STICKER,
  VOICE,
  ANIMATION,
  LOCATION,
  CONTACT,
  PIN_MESSAGE,
  UNPIN_MESSAGE,
  DELETE_MESSAGE,
  BAN_USER,
  UNBAN_USER,
  MUTE_USER,
  UNMUTE_USER,
  KICK_USER,
  PROMOTE_USER,
  DEMOTE_USER,
  ADMIN_RIGHTS,
  BROADCAST,
  NODE_TYPES,
} from './node-types';

export type { NodeType } from './node-types';

// Действия кнопок
export {
  GOTO,
  CALLBACK,
  URL,
  COMMAND,
  CONTACT,
  LOCATION,
  SELECTION,
  DEFAULT,
  BUTTON_ACTIONS,
} from './button-actions';

export type { ButtonActionType } from './button-actions';
