/**
 * @fileoverview Рендерер шаблона userbot_edit_trigger
 * @module templates/userbot-edit-trigger/userbot-edit-trigger.renderer
 */

import type { UserbotEditTriggerTemplateParams } from './userbot-edit-trigger.params';
import { userbotEditTriggerParamsSchema } from './userbot-edit-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код обработчика триггера редактирования
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateUserbotEditTrigger(params: UserbotEditTriggerTemplateParams): string {
  const validated = userbotEditTriggerParamsSchema.parse(params);
  return renderPartialTemplate('userbot-edit-trigger/userbot-edit-trigger.py.jinja2', {
    ...validated,
  });
}

/**
 * Генерирует обработчики для всех узлов userbot_edit_trigger
 * @param nodes - Все узлы проекта
 * @param projectId - ID проекта
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateUserbotEditTriggerHandlers(nodes: Node[], projectId: number | null = null): string {
  const triggerNodes = nodes.filter(n => (n.type as string) === 'userbot_edit_trigger');
  if (triggerNodes.length === 0) return '';

  const handlers = triggerNodes.map(node => {
    const data = node.data as any;
    return generateUserbotEditTrigger({
      nodeId: node.id,
      userbotEntity: data.userbotEntity || '',
      filterType: data.filterType || 'any',
      filterValue: data.filterValue || '',
      saveTextTo: data.saveTextTo || 'edit_text',
      saveMessageIdTo: data.saveMessageIdTo || 'edit_msg_id',
      saveChatIdTo: data.saveChatIdTo || '',
      saveSenderIdTo: data.saveSenderIdTo || '',
      autoTransitionTo: data.autoTransitionTo || undefined,
      projectId,
    });
  });

  return handlers.join('\n\n');
}
