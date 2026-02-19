/**
 * @fileoverview Константы для узлов управления
 * 
 * Содержит списки типов узлов для различных проверок и фильтрации
 * в панели свойств редактора бота.
 * 
 * @module node-constants
 */

import { Node } from '@shared/schema';

/**
 * Список типов узлов управления
 * 
 * Узлы управления не имеют контента сообщения (текста, медиа),
 * так как выполняют служебные функции:
 * - Закрепление/открепление сообщений
 * - Удаление сообщений
 * - Управление пользователями (бан, разбан, мут, кик)
 * - Назначение/снятие прав администратора
 */
export const MANAGEMENT_NODE_TYPES = [
  'pin_message',
  'unpin_message',
  'delete_message',
  'ban_user',
  'unban_user',
  'mute_user',
  'unmute_user',
  'kick_user',
  'promote_user',
  'demote_user',
  'admin_rights'
] as const;

/**
 * Проверяет, является ли узел узлом управления
 * 
 * @param {Node['type']} nodeType - Тип узла для проверки
 * @returns {boolean} true, если узел является узлом управления
 */
export function isManagementNode(nodeType: Node['type']): boolean {
  return MANAGEMENT_NODE_TYPES.includes(nodeType as typeof MANAGEMENT_NODE_TYPES[number]);
}
