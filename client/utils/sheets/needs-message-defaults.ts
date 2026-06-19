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
 *
 * - condition — чисто логическая нода
 * - comment — заметка на холсте
 * - edit_message — использует собственные поля editButtons/editKeyboardType/editMessageText
 * - answer_callback_query — action-нода без контента сообщения
 */
const NON_MESSAGE_EXTRA_TYPES = new Set<string>([
  'condition',
  'comment',
  'edit_message',
  'answer_callback_query',
]);

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

/**
 * Служебные поля сообщения, которые исторически подмешивались всем нодам.
 * Для не-message нод эти поля — мусор и подлежат удалению при загрузке.
 */
const MESSAGE_JUNK_FIELDS = [
  'messageText',
  'buttons',
  'keyboardType',
  'markdown',
  'oneTimeKeyboard',
  'resizeKeyboard',
  'isPrivateOnly',
  'adminOnly',
  'requiresAuth',
  'showInMenu',
  'enableStatistics',
] as const;

/**
 * Удаляет мусорные служебные поля сообщения у нод, которым они не нужны.
 *
 * Работает как blacklist: трогает только заранее известный набор полей
 * (MESSAGE_JUNK_FIELDS) и только для не-message нод. Собственные поля ноды
 * (editButtons, callbackNotificationText и т.п.) не затрагиваются.
 *
 * @param node - Узел для очистки
 * @returns Узел без мусорных полей (новый объект, если что-то удалено)
 */
export function stripMessageJunkFields(node: Node): Node {
  if (needsMessageDefaults(node.type)) return node;

  const data = node.data as Record<string, unknown>;
  const junkKeys = MESSAGE_JUNK_FIELDS.filter((key) => key in data);
  if (junkKeys.length === 0) return node;

  const cleanedData = { ...data };
  for (const key of junkKeys) {
    delete cleanedData[key];
  }
  return { ...node, data: cleanedData as Node['data'] };
}
