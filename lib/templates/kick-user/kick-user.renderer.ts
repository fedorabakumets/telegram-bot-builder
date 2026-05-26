/**
 * @fileoverview Рендерер шаблона узла kick_user
 * @module templates/kick-user/kick-user.renderer
 */

import type { Node } from '@shared/schema';
import type { KickUserEntry, KickUserTemplateParams } from './kick-user.params';
import { kickUserParamsSchema } from './kick-user.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает KickUserEntry[] из массива узлов графа.
 * Находит все узлы с type === 'kick_user'.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив KickUserEntry для генерации обработчиков
 */
export function collectKickUserEntries(nodes: Node[]): KickUserEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: KickUserEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'kick_user') continue;

    const data = node.data as any;
    const targetNodeId: string = data?.autoTransitionTo ?? '';
    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? '';

    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      targetNodeId,
      targetNodeType,
      userIdSource: data?.userIdSource ?? 'current_user',
      userIdManual: data?.userIdManual ?? '',
      chatIdSource: data?.chatIdSource ?? 'current_chat',
      chatIdManual: data?.chatIdManual ?? '',
      ignoreErrors: data?.ignoreErrors ?? true,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков узла kick_user из параметров.
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateKickUser(params: KickUserTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = kickUserParamsSchema.parse(params);
  return renderPartialTemplate('kick-user/kick-user.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков узла kick_user из массива узлов.
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateKickUserHandlers(nodes: Node[]): string {
  const entries = collectKickUserEntries(nodes);
  if (entries.length === 0) return '';
  return generateKickUser({ entries });
}
