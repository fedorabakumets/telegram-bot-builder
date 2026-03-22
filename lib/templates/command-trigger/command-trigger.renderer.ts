/**
 * @fileoverview Функция рендеринга шаблона обработчиков командных триггеров
 * @module templates/command-trigger/command-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { CommandTriggerEntry, CommandTriggerTemplateParams } from './command-trigger.params';
import { commandTriggerParamsSchema } from './command-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает CommandTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'command_trigger', извлекает command,
 * autoTransitionTo и тип целевого узла.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив CommandTriggerEntry для генерации обработчиков
 */
export function collectCommandTriggerEntries(nodes: Node[]): CommandTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));

  const entries: CommandTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'command_trigger') continue;

    const command: string = (node.data as any).command ?? '';
    if (!command.trim()) continue;

    const targetNodeId: string = (node.data as any).autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      command,
      description: (node.data as any).description,
      showInMenu: (node.data as any).showInMenu,
      isPrivateOnly: node.data.isPrivateOnly,
      targetNodeId,
      targetNodeType,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков командных триггеров из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateCommandTriggers(params: CommandTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = commandTriggerParamsSchema.parse(params);
  return renderPartialTemplate('command-trigger/command-trigger.py.jinja2', {
    commandTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков командных триггеров из массива узлов графа (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateCommandTriggerHandlers(nodes: Node[]): string {
  const entries = collectCommandTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateCommandTriggers({ entries });
}
