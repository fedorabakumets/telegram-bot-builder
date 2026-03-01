/**
 * @fileoverview Константы типов узлов бота
 * 
 * Модуль содержит все допустимые типы узлов графа бота.
 * Используется для типизации и валидации узлов.
 * 
 * @module bot-generator/constants/node-types
 */

/**
 * Тип узла: стартовая команда
 * 
 * @example
 * const type: NodeType = NODE_TYPES.START;
 */
export const START = 'start' as const;

/**
 * Тип узла: сообщение
 * 
 * @example
 * const type: NodeType = NODE_TYPES.MESSAGE;
 */
export const MESSAGE = 'message' as const;

/**
 * Тип узла: команда
 * 
 * @example
 * const type: NodeType = NODE_TYPES.COMMAND;
 */
export const COMMAND = 'command' as const;

/**
 * Тип узла: стикер
 * 
 * @example
 * const type: NodeType = NODE_TYPES.STICKER;
 */
export const STICKER = 'sticker' as const;

/**
 * Тип узла: голосовое сообщение
 * 
 * @example
 * const type: NodeType = NODE_TYPES.VOICE;
 */
export const VOICE = 'voice' as const;

/**
 * Тип узла: анимация (GIF)
 * 
 * @example
 * const type: NodeType = NODE_TYPES.ANIMATION;
 */
export const ANIMATION = 'animation' as const;

/**
 * Тип узла: геолокация
 * 
 * @example
 * const type: NodeType = NODE_TYPES.LOCATION;
 */
export const LOCATION = 'location' as const;

/**
 * Тип узла: контакт
 * 
 * @example
 * const type: NodeType = NODE_TYPES.CONTACT;
 */
export const CONTACT = 'contact' as const;

/**
 * Тип узла: закрепить сообщение
 * 
 * @example
 * const type: NodeType = NODE_TYPES.PIN_MESSAGE;
 */
export const PIN_MESSAGE = 'pin_message' as const;

/**
 * Тип узла: открепить сообщение
 * 
 * @example
 * const type: NodeType = NODE_TYPES.UNPIN_MESSAGE;
 */
export const UNPIN_MESSAGE = 'unpin_message' as const;

/**
 * Тип узла: удалить сообщение
 * 
 * @example
 * const type: NodeType = NODE_TYPES.DELETE_MESSAGE;
 */
export const DELETE_MESSAGE = 'delete_message' as const;

/**
 * Тип узла: заблокировать пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.BAN_USER;
 */
export const BAN_USER = 'ban_user' as const;

/**
 * Тип узла: разблокировать пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.UNBAN_USER;
 */
export const UNBAN_USER = 'unban_user' as const;

/**
 * Тип узла: заглушить пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.MUTE_USER;
 */
export const MUTE_USER = 'mute_user' as const;

/**
 * Тип узла: снять ограничения с пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.UNMUTE_USER;
 */
export const UNMUTE_USER = 'unmute_user' as const;

/**
 * Тип узла: исключить пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.KICK_USER;
 */
export const KICK_USER = 'kick_user' as const;

/**
 * Тип узла: повысить пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.PROMOTE_USER;
 */
export const PROMOTE_USER = 'promote_user' as const;

/**
 * Тип узла: понизить пользователя
 * 
 * @example
 * const type: NodeType = NODE_TYPES.DEMOTE_USER;
 */
export const DEMOTE_USER = 'demote_user' as const;

/**
 * Тип узла: права администратора
 * 
 * @example
 * const type: NodeType = NODE_TYPES.ADMIN_RIGHTS;
 */
export const ADMIN_RIGHTS = 'admin_rights' as const;

/**
 * Тип узла: рассылка
 * 
 * @example
 * const type: NodeType = NODE_TYPES.BROADCAST;
 */
export const BROADCAST = 'broadcast' as const;

/**
 * Все типы узлов в одном объекте
 * 
 * @example
 * const types = Object.values(NODE_TYPES);
 */
export const NODE_TYPES = {
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
} as const;

/**
 * Тип для всех возможных типов узлов
 * 
 * @example
 * const type: NodeType = 'start';
 */
export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];
