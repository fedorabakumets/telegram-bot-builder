/**
 * @fileoverview Функции рендеринга шаблона обработчиков узла answer_callback_query
 * @module templates/answer-callback-query/answer-callback-query.renderer
 */

import type { Node } from '@shared/schema';
import type { AnswerCallbackQueryEntry, AnswerCallbackQueryTemplateParams } from './answer-callback-query.params';
import { answerCallbackQueryParamsSchema } from './answer-callback-query.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает AnswerCallbackQueryEntry[] из массива узлов графа.
 * Находит все узлы с type === 'answer_callback_query'.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив AnswerCallbackQueryEntry для генерации обработчиков
 */
export function collectAnswerCallbackQueryEntries(nodes: Node[]): AnswerCallbackQueryEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: AnswerCallbackQueryEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'answer_callback_query') continue;

    const targetNodeId: string = (node.data as any)?.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      notificationText: (node.data as any)?.callbackNotificationText || '',
      showAlert: (node.data as any)?.callbackShowAlert ?? false,
      cacheTime: (node.data as any)?.callbackCacheTime ?? 0,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков узла answer_callback_query из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateAnswerCallbackQuery(params: AnswerCallbackQueryTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = answerCallbackQueryParamsSchema.parse(params);
  return renderPartialTemplate('answer-callback-query/answer-callback-query.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков узла answer_callback_query из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateAnswerCallbackQueryHandlers(nodes: Node[]): string {
  const entries = collectAnswerCallbackQueryEntries(nodes);
  if (entries.length === 0) return '';
  return generateAnswerCallbackQuery({ entries });
}
