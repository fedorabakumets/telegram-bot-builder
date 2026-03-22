/**
 * @fileoverview Функция рендеринга шаблона обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { TextTriggerEntry, TextTriggerTemplateParams } from './text-trigger.params';
import { textTriggerParamsSchema } from './text-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает TextTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'text_trigger', извлекает textSynonyms,
 * textMatchType, autoTransitionTo и тип целевого узла.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив TextTriggerEntry для генерации обработчиков
 */
export function collectTextTriggerEntries(nodes: Node[]): TextTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));

  const entries: TextTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'text_trigger') continue;

    const synonyms: string[] = (node.data.textSynonyms ?? [])
      .filter((s: string) => s.trim().length > 0)
      .map((s: string) =>
        s
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '')
      );
    if (synonyms.length === 0) continue;

    const targetNodeId: string = node.data.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      synonyms,
      matchType: (node.data.textMatchType as 'exact' | 'contains') ?? 'exact',
      targetNodeId,
      targetNodeType,
      isPrivateOnly: node.data.isPrivateOnly,
      adminOnly: node.data.adminOnly,
      requiresAuth: node.data.requiresAuth,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков текстовых триггеров из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateTextTriggers(params: TextTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = textTriggerParamsSchema.parse(params);
  return renderPartialTemplate('text-trigger/text-trigger.py.jinja2', {
    textTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков текстовых триггеров из массива узлов графа (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateTextTriggerHandlers(nodes: Node[]): string {
  const entries = collectTextTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateTextTriggers({ entries });
}
