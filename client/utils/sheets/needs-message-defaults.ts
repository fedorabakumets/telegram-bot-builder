/**
 * @fileoverview Определяет, нужны ли ноде служебные поля сообщения по умолчанию.
 * @module client/utils/sheets/needs-message-defaults
 */

import { Node } from '@shared/schema';
import { isTriggerNode, isManagementNode } from '@/components/editor/properties/utils/node-constants';

/**
 * Типы нод, которым НЕ нужны служебные поля сообщения
 * (buttons, keyboardType, markdown, isPrivateOnly, adminOnly и т.п.),
 * помимо триггеров и management-нод.
 */
const NON_MESSAGE_EXTRA_TYPES = new Set<string>(['condition', 'comment']);

/**
 * Проверяет, нужно ли подмешивать ноде служебные поля сообщения по умолчанию.
 *
 * Триггеры, management-ноды (логика, интеграции, управление пользователями),
 * а также condition и comment не используют поля сообщения — для них
 * принудительное добавление дефолтов создаёт мусор в JSON.
 *
 * @param type - Тип ноды
 * @returns true, если ноде нужны служебные поля сообщения
 */
export function needsMessageDefaults(type: Node['type']): boolean {
  if (isTriggerNode(type)) return false;
  if (isManagementNode(type)) return false;
  if (NON_MESSAGE_EXTRA_TYPES.has(type as string)) return false;
  return true;
}
