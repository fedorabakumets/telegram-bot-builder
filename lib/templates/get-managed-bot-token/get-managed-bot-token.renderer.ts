/**
 * @fileoverview Функции рендеринга шаблона обработчиков узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/get-managed-bot-token.renderer
 */

import type { Node } from '@shared/schema';
import type { GetManagedBotTokenEntry, GetManagedBotTokenTemplateParams } from './get-managed-bot-token.params';
import { getManagedBotTokenParamsSchema } from './get-managed-bot-token.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает GetManagedBotTokenEntry[] из массива узлов графа.
 * Находит все узлы с type === 'get_managed_bot_token' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив GetManagedBotTokenEntry для генерации обработчиков
 */
export function collectGetManagedBotTokenEntries(nodes: Node[]): GetManagedBotTokenEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: GetManagedBotTokenEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'get_managed_bot_token') continue;

    const targetNodeId: string = node.data?.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      botIdSource: node.data?.botIdSource || 'variable',
      botIdVariable: node.data?.botIdVariable || undefined,
      botIdManual: node.data?.botIdManual || undefined,
      saveTokenTo: node.data?.saveTokenTo || undefined,
      saveErrorTo: node.data?.saveErrorTo || undefined,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков узла получения токена управляемого бота из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateGetManagedBotToken(params: GetManagedBotTokenTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = getManagedBotTokenParamsSchema.parse(params);
  return renderPartialTemplate('get-managed-bot-token/get-managed-bot-token.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков узла получения токена управляемого бота из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateGetManagedBotTokenHandlers(nodes: Node[]): string {
  const entries = collectGetManagedBotTokenEntries(nodes);
  if (entries.length === 0) return '';
  return generateGetManagedBotToken({ entries });
}
