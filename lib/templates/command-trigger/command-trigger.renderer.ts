/**
 * @fileoverview Функция рендеринга шаблона обработчиков командных триггеров
 * @module templates/command-trigger/command-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { CommandTriggerEntry, CommandTriggerTemplateParams } from './command-trigger.params';
import { commandTriggerParamsSchema } from './command-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

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
      adminOnly: node.data.adminOnly,
      requiresAuth: node.data.requiresAuth,
      targetNodeId,
      targetNodeType,
      deepLinkMatchMode: (node.data as any).deepLinkMatchMode,
      deepLinkParam: (node.data as any).deepLinkParam,
      deepLinkSaveToVar: (node.data as any).deepLinkSaveToVar,
      deepLinkVarName: (node.data as any).deepLinkVarName,
    });
  }

  return entries;
}

export function generateCommandTriggers(params: CommandTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = commandTriggerParamsSchema.parse(params);
  return renderPartialTemplate('command-trigger/command-trigger.py.jinja2', {
    commandTriggerEntries: validated.entries,
  });
}

export function generateCommandTriggerHandlers(nodes: Node[]): string {
  const entries = collectCommandTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateCommandTriggers({ entries });
}
