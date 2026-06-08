/**
 * @fileoverview Рендерер шаблона userbot_click_button
 * @module templates/userbot-click-button/userbot-click-button.renderer
 */

import type { UserbotClickButtonTemplateParams } from './userbot-click-button.params';
import { userbotClickButtonParamsSchema } from './userbot-click-button.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код обработчика нажатия кнопки через юзербот
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateUserbotClickButton(params: UserbotClickButtonTemplateParams): string {
  const validated = userbotClickButtonParamsSchema.parse(params);
  return renderPartialTemplate('userbot-click-button/userbot-click-button.py.jinja2', { ...validated });
}

/**
 * Генерирует обработчики для всех узлов userbot_click_button
 * @param nodes - Все узлы проекта
 * @param projectId - ID проекта (для get_content)
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateUserbotClickButtonHandlers(nodes: Node[], projectId: number | null = null): string {
  const clickNodes = nodes.filter(n => (n.type as string) === 'userbot_click_button');
  if (clickNodes.length === 0) return '';

  const handlers = clickNodes.map(node => {
    const data = node.data as any;
    return generateUserbotClickButton({
      nodeId: node.id,
      userbotEntity: data.userbotEntity || '',
      messageId: data.messageId || '',
      messageIdSource: data.messageIdSource || 'manual',
      clickMode: data.clickMode || 'text',
      clickValue: data.clickValue || '',
      saveAlertTo: data.saveAlertTo || undefined,
      saveResultTo: data.saveResultTo || undefined,
      saveButtonsTo: data.saveButtonsTo || undefined,
      saveHasMediaTo: data.saveHasMediaTo || undefined,
      saveMediaTo: data.saveMediaTo || undefined,
      responseStrategy: data.responseStrategy || 'edit',
      clickDelivery: data.clickDelivery || 'fire_and_forget',
      autoTransitionTo: data.autoTransitionTo || undefined,
      projectId,
    });
  });

  return handlers.join('\n\n');
}
