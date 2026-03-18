/**
 * @fileoverview Функция рендеринга шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.renderer
 */

import type { Node } from '@shared/schema';
import type { SynonymEntry, SynonymsTemplateParams } from './synonyms.params';
import { synonymsParamsSchema } from './synonyms.schema';
import { renderPartialTemplate } from '../template-renderer';
import { NODE_TYPES } from '../../bot-generator/types/node-type.constants';

const USER_MANAGEMENT_TYPES = new Set([
  NODE_TYPES.BAN_USER, NODE_TYPES.UNBAN_USER, NODE_TYPES.MUTE_USER, NODE_TYPES.UNMUTE_USER,
  NODE_TYPES.KICK_USER, NODE_TYPES.PROMOTE_USER, NODE_TYPES.DEMOTE_USER, NODE_TYPES.ADMIN_RIGHTS,
]);

/**
 * Собирает SynonymEntry[] из массива узлов графа.
 * Переносит логику фильтрации из bot-generator/Synonyms/generateSynonymHandler.ts
 */
export function collectSynonymEntries(nodes: Node[]): SynonymEntry[] {
  const validNodes = nodes.filter(n => n != null && n.data?.synonyms?.length > 0);

  const hasStartNode = nodes.some(n => n != null && n.type === NODE_TYPES.START);

  const entries: SynonymEntry[] = [];

  for (const node of validNodes) {
    // Синонимы start-узла создаём только если start-узел существует в графе
    if (node.type === NODE_TYPES.START && !hasStartNode) continue;

    for (const synonym of node.data.synonyms as string[]) {
      const base = { synonym, nodeId: node.id, nodeType: node.type as SynonymEntry['nodeType'] };

      if (node.type === NODE_TYPES.START || node.type === NODE_TYPES.COMMAND) {
        const originalCommand = node.data.command || (node.type === NODE_TYPES.START ? '/start' : '/help');
        const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
        entries.push({ ...base, functionName, originalCommand });

      } else if (node.type === NODE_TYPES.MESSAGE) {
        entries.push(base);

      } else if (['pin_message', 'unpin_message', 'delete_message'].includes(node.type)) {
        entries.push({
          ...base,
          messageText: node.data.messageText,
          disableNotification: node.data.disableNotification,
        });

      } else if (USER_MANAGEMENT_TYPES.has(node.type)) {
        entries.push({
          ...base,
          reason: node.data.reason,
          untilDate: node.data.untilDate,
          duration: node.data.duration,
          canSendMessages: node.data.canSendMessages,
          canSendMediaMessages: node.data.canSendMediaMessages,
          canDeleteMessages: node.data.canDeleteMessages,
          canInviteUsers: node.data.canInviteUsers,
          canPinMessages: node.data.canPinMessages,
        });
      }
    }
  }

  return entries;
}

/**
 * Генерация Python обработчиков синонимов из параметров (низкоуровневый API)
 */
export function generateSynonyms(params: SynonymsTemplateParams): string {
  if (params.synonyms.length === 0) return '';
  const validated = synonymsParamsSchema.parse(params);
  return renderPartialTemplate('synonyms/synonyms.py.jinja2', { synonymEntries: validated.synonyms });
}

/**
 * Генерация Python обработчиков синонимов из массива узлов графа (высокоуровневый API).
 * Заменяет generateSynonymHandlers из bot-generator/Synonyms.
 */
export function generateSynonymHandlers(nodes: Node[]): string {
  const entries = collectSynonymEntries(nodes);
  if (entries.length === 0) return '';
  return generateSynonyms({ synonyms: entries });
}
