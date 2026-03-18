/**
 * @fileoverview Renderer для шаблона обработчиков управления сообщениями
 * @module templates/message-handler/message-handler.renderer
 */

import type { Node } from '@shared/schema';
import type { MessageHandlerTemplateParams } from './message-handler.params';
import { messageHandlerParamsSchema } from './message-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python обработчик управления сообщениями из параметров (низкоуровневый API)
 */
export function generateMessageHandler(params: MessageHandlerTemplateParams): string {
  const validated = messageHandlerParamsSchema.parse(params);
  return renderPartialTemplate('message-handler/message-handler.py.jinja2', validated);
}

/**
 * Собирает параметры MessageHandlerTemplateParams из узла графа
 */
export function nodeToMessageHandlerParams(node: Node): MessageHandlerTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const rawSynonyms = node.data.synonyms;

  const synonyms: string[] = Array.isArray(rawSynonyms)
    ? rawSynonyms.map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : typeof rawSynonyms === 'string'
      ? rawSynonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : [];

  const defaults: Record<string, string[]> = {
    pin_message:    ['закрепить', 'прикрепить', 'зафиксировать'],
    unpin_message:  ['открепить', 'отцепить', 'убрать закрепление'],
    delete_message: ['удалить', 'стереть', 'убрать сообщение'],
  };

  return {
    nodeType: node.type as MessageHandlerTemplateParams['nodeType'],
    nodeId: node.id,
    safeName,
    synonyms: synonyms.length > 0 ? synonyms : (defaults[node.type] ?? []),
    targetGroupId: node.data.targetGroupId || '',
    disableNotification: node.data.disableNotification ?? false,
    messageText: node.data.messageText || '',
  };
}

/**
 * Генерирует Python обработчики управления сообщениями из узла графа (высокоуровневый API).
 * Заменяет generateDeleteMessageHandler, generatePinMessageHandler, generateUnpinMessageHandler
 * из bot-generator/MessageHandler.
 */
export function generateMessageHandlerFromNode(node: Node): string {
  return generateMessageHandler(nodeToMessageHandlerParams(node));
}
