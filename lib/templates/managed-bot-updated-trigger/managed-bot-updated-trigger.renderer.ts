/**
 * @fileoverview Функция рендеринга шаблона обработчиков триггеров обновления управляемого бота
 * @module templates/managed-bot-updated-trigger/managed-bot-updated-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { ManagedBotUpdatedTriggerEntry, ManagedBotUpdatedTriggerTemplateParams } from './managed-bot-updated-trigger.params';
import { managedBotUpdatedTriggerParamsSchema } from './managed-bot-updated-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает ManagedBotUpdatedTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'managed_bot_updated_trigger' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив ManagedBotUpdatedTriggerEntry для генерации middleware
 */
export function collectManagedBotUpdatedTriggerEntries(nodes: Node[]): ManagedBotUpdatedTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: ManagedBotUpdatedTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'managed_bot_updated_trigger') continue;

    const targetNodeId: string = node.data?.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      saveBotIdTo: node.data?.saveBotIdTo || undefined,
      saveBotUsernameTo: node.data?.saveBotUsernameTo || undefined,
      saveBotNameTo: node.data?.saveBotNameTo || undefined,
      saveCreatorIdTo: node.data?.saveCreatorIdTo || undefined,
      saveCreatorUsernameTo: node.data?.saveCreatorUsernameTo || undefined,
      filterByUserId: node.data?.filterByUserId || undefined,
    });
  }

  return entries;
}

/**
 * Генерация Python middleware триггеров обновления управляемого бота из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateManagedBotUpdatedTriggers(params: ManagedBotUpdatedTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = managedBotUpdatedTriggerParamsSchema.parse(params);
  return renderPartialTemplate('managed-bot-updated-trigger/managed-bot-updated-trigger.py.jinja2', {
    managedBotUpdatedTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python middleware триггеров обновления управляемого бота из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateManagedBotUpdatedTriggerHandlers(nodes: Node[]): string {
  const entries = collectManagedBotUpdatedTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateManagedBotUpdatedTriggers({ entries });
}
