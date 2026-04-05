/**
 * @fileoverview Константы типов узлов бота
 * Единый источник истины для всех типов узлов.
 *
 * @module bot-generator/types/node-type.constants
 */

export const NODE_TYPES = {
  START: 'start',
  COMMAND: 'command',
  MESSAGE: 'message',
  PHOTO: 'photo',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  VOICE: 'voice',
  ANIMATION: 'animation',
  LOCATION: 'location',
  CONTACT: 'contact',
  MUTE_USER: 'mute_user',
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user',
  UNMUTE_USER: 'unmute_user',
  KICK_USER: 'kick_user',
  PROMOTE_USER: 'promote_user',
  DEMOTE_USER: 'demote_user',
  PIN_MESSAGE: 'pin_message',
  UNPIN_MESSAGE: 'unpin_message',
  DELETE_MESSAGE: 'delete_message',
  ADMIN_RIGHTS: 'admin_rights',
  BROADCAST: 'broadcast',
  KEYBOARD: 'keyboard',
  INPUT: 'input',
  CONDITION: 'condition',
  CLIENT_AUTH: 'client_auth',
  MEDIA: 'media',
  HTTP_REQUEST: 'http_request',
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];
