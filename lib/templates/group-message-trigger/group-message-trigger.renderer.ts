/**
 * @fileoverview Рендерер шаблона триггера сообщения в топике форум-группы
 * @module templates/group-message-trigger/group-message-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { GroupMessageTriggerEntry, GroupMessageTriggerTemplateParams } from './group-message-trigger.params';
import { groupMessageTriggerParamsSchema } from './group-message-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает GroupMessageTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'group_message_trigger' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив GroupMessageTriggerEntry для генерации обработчиков
 */
export function collectGroupMessageTriggerEntries(nodes: Node[]): GroupMessageTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: GroupMessageTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'group_message_trigger') continue;

    const targetNodeId: string = node.data?.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';
    const data = node.data as any;

    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      groupChatId: String(data?.groupChatId ?? ''),
      groupChatIdSource: data?.groupChatIdSource === 'variable' ? 'variable' : 'manual',
      groupChatVariableName: String(data?.groupChatVariableName ?? ''),
      threadIdVariable: String(data?.threadIdVariable ?? 'support_thread_id'),
      resolvedUserIdVariable: String(data?.resolvedUserIdVariable ?? 'resolved_user_id'),
      targetNodeId,
      targetNodeType,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков триггеров сообщений в группе из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateGroupMessageTriggers(params: GroupMessageTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = groupMessageTriggerParamsSchema.parse(params);
  return renderPartialTemplate('group-message-trigger/group-message-trigger.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков триггеров сообщений в группе из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateGroupMessageTriggerHandlers(nodes: Node[]): string {
  const entries = collectGroupMessageTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateGroupMessageTriggers({ entries });
}
