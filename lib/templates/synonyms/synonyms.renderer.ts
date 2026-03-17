/**
 * @fileoverview Функция рендеринга шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.renderer
 */

import type { Node } from '@shared/schema';
import type { SynonymEntry, SynonymsTemplateParams } from './synonyms.params';
import { synonymsParamsSchema } from './synonyms.schema';
import { renderPartialTemplate } from '../template-renderer';

const USER_MANAGEMENT_TYPES = new Set([
  'ban_user', 'unban_user', 'mute_user', 'unmute_user',
  'kick_user', 'promote_user', 'demote_user', 'admin_rights',
]);

/**
 * Собирает SynonymEntry[] из массива узлов графа.
 * Переносит логику фильтрации из bot-generator/Synonyms/generateSynonymHandler.ts
 */
export function collectSynonymEntries(nodes: Node[]): SynonymEntry[] {
  const validNodes = nodes.filter(n => n != null && n.data?.synonyms?.length > 0);

  const hasStartNode = nodes.some(n => n.type === 'start');

  const entries: SynonymEntry[] = [];

  for (const node of validNodes) {
    // Синонимы start-узла создаём только если start-узел существует в графе
    if (node.type === 'start' && !hasStartNode) continue;

    for (const synonym of node.data.synonyms as string[]) {
      const base = { synonym, nodeId: node.id, nodeType: node.type as SynonymEntry['nodeType'] };

      if (node.type === 'start' || node.type === 'command') {
        const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
        const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
        entries.push({ ...base, functionName, originalCommand });

      } else if (node.type === 'message') {
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
