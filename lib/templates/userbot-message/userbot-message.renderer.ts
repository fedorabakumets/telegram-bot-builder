/**
 * @fileoverview Рендерер шаблона userbot_message
 * @module templates/userbot-message/userbot-message.renderer
 */

import type { UserbotMessageTemplateParams } from './userbot-message.params';
import { userbotMessageParamsSchema } from './userbot-message.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код обработчика userbot-сообщения
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateUserbotMessage(params: UserbotMessageTemplateParams): string {
  const validated = userbotMessageParamsSchema.parse(params);

  return renderPartialTemplate('userbot-message/userbot-message.py.jinja2', {
    ...validated,
  });
}

/**
 * Генерирует обработчики для всех узлов userbot_message
 * @param nodes - Все узлы проекта
 * @param projectId - ID проекта (для get_content)
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateUserbotMessageHandlers(nodes: Node[], projectId: number | null = null): string {
  const userbotNodes = nodes.filter(n => (n.type as string) === 'userbot_message');
  if (userbotNodes.length === 0) return '';

  const handlers = userbotNodes.map(node => {
    const data = node.data as any;
    return generateUserbotMessage({
      nodeId: node.id,
      messageText: data.messageText || '',
      formatMode: data.formatMode || 'html',
      disableLinkPreview: data.disableLinkPreview || false,
      userbotEntity: data.userbotEntity || '',
      userbotRecipients: (data.userbotRecipients || []).filter((r: string) => r.trim()),
      attachedMedia: (data.attachedMedia || []).filter((m: string) => !m.includes('"__type":"file_id"')),
      saveMessageIdTo: data.saveMessageIdTo || undefined,
      saveResponseIdTo: data.saveResponseIdTo || undefined,
      saveResponseTextTo: data.saveResponseTextTo || undefined,
      saveButtonsTo: data.saveButtonsTo || undefined,
      responseWaitSeconds: data.responseWaitSeconds || 3,
      responseStrategy: data.responseStrategy || 'longest',
      responseFilterRegex: data.responseFilterRegex || '',
      responseFloorMessageIdVar: data.responseFloorMessageIdVar || undefined,
      autoTransitionTo: data.autoTransitionTo || undefined,
      projectId,
    });
  });

  return handlers.join('\n\n');
}
