/**
 * @fileoverview Функция рендеринга шаблона обработчиков триггера участника
 * @module templates/member-trigger/member-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { MemberEventType, MemberTriggerEntry, MemberTriggerTemplateParams } from './member-trigger.params';
import { memberTriggerParamsSchema } from './member-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Определяет, задан ли фильтр по ID группы
 * @param data - Данные узла member_trigger
 * @returns true если фильтр нужно применять
 */
function hasGroupChatFilter(data: Record<string, unknown>): boolean {
  const source = data.groupChatIdSource === 'variable' ? 'variable' : 'manual';
  if (source === 'manual') {
    return Boolean(String(data.groupChatId ?? '').trim());
  }
  return Boolean(String(data.groupChatVariableName ?? '').trim());
}

/**
 * Собирает MemberTriggerEntry[] из массива узлов графа.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив MemberTriggerEntry для генерации обработчиков
 */
export function collectMemberTriggerEntries(nodes: Node[]): MemberTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: MemberTriggerEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'member_trigger') continue;

    const targetNodeId: string = node.data?.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';
    const data = (node.data ?? {}) as Record<string, unknown>;
    const memberEventType = (data.memberEventType as MemberEventType) || 'join';
    const groupChatIdSource = data.groupChatIdSource === 'variable' ? 'variable' : 'manual';

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      memberEventType,
      groupChatId: String(data.groupChatId ?? '') || undefined,
      groupChatIdSource,
      groupChatVariableName: String(data.groupChatVariableName ?? '') || undefined,
      saveJoinedUserIdTo: String(data.saveJoinedUserIdTo ?? '') || undefined,
      saveJoinedUsernameTo: String(data.saveJoinedUsernameTo ?? '') || undefined,
      saveLeftUserIdTo: String(data.saveLeftUserIdTo ?? '') || undefined,
      saveLeftUsernameTo: String(data.saveLeftUsernameTo ?? '') || undefined,
      hasGroupChatFilter: hasGroupChatFilter(data),
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков триггера участника из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateMemberTriggers(params: MemberTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = memberTriggerParamsSchema.parse(params);
  return renderPartialTemplate('member-trigger/member-trigger.py.jinja2', {
    memberTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков триггера участника из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateMemberTriggerHandlers(nodes: Node[]): string {
  const entries = collectMemberTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateMemberTriggers({ entries });
}
