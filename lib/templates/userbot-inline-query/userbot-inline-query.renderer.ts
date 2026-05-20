/**
 * @fileoverview Рендерер шаблона userbot_inline_query
 * @module templates/userbot-inline-query/userbot-inline-query.renderer
 */

import type { UserbotInlineQueryTemplateParams } from './userbot-inline-query.params';
import { userbotInlineQueryParamsSchema } from './userbot-inline-query.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код обработчика inline-запроса через юзербот
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateUserbotInlineQuery(params: UserbotInlineQueryTemplateParams): string {
  const validated = userbotInlineQueryParamsSchema.parse(params);
  return renderPartialTemplate('userbot-inline-query/userbot-inline-query.py.jinja2', { ...validated });
}

/**
 * Генерирует обработчики для всех узлов userbot_inline_query
 * @param nodes - Все узлы проекта
 * @param projectId - ID проекта (для get_content)
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateUserbotInlineQueryHandlers(nodes: Node[], projectId: number | null = null): string {
  const iqNodes = nodes.filter(n => (n.type as string) === 'userbot_inline_query');
  if (iqNodes.length === 0) return '';

  const handlers = iqNodes.map(node => {
    const data = node.data as any;
    return generateUserbotInlineQuery({
      nodeId: node.id,
      botUsername: data.botUsername || '',
      query: data.query || '',
      targetChat: data.targetChat || '',
      sendToSameChat: data.sendToSameChat ?? true,
      resultIndex: data.resultIndex || '0',
      saveResultTitleTo: data.saveResultTitleTo || undefined,
      saveResultDescTo: data.saveResultDescTo || undefined,
      saveResponseIdTo: data.saveResponseIdTo || undefined,
      autoTransitionTo: data.autoTransitionTo || undefined,
      projectId,
    });
  });

  return handlers.join('\n\n');
}
