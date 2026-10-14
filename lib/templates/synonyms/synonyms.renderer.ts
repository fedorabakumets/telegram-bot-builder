/**
 * @fileoverview Функция рендеринга шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.renderer
 */

import type { Node } from '@shared/schema';
import type { SynonymEntry, SynonymsTemplateParams } from './synonyms.params';
import { synonymsParamsSchema } from './synonyms.schema';
import { renderPartialTemplate } from '../template-renderer';
import { NODE_TYPES } from '../../bot-generator/types/node-type.constants';
import { omitUndefined, stripLegacyMediaPermission } from '../chat-permissions/resolve-mute-media';

/** Права ограничения и назначения, которые переносятся в синоним как есть */
const PASSTHROUGH_BOOL_KEYS = [
  'canSendMessages',
  'canSendAudios',
  'canSendDocuments',
  'canSendPhotos',
  'canSendVideos',
  'canSendVideoNotes',
  'canSendVoiceNotes',
  'canSendPolls',
  'canSendOtherMessages',
  'canAddWebPagePreviews',
  'canReactToMessages',
  'canChangeGroupInfo',
  'canInviteUsers2',
  'canPinMessages2',
  'canDeleteMessages',
  'canInviteUsers',
  'canPinMessages',
  'canManageChat',
  'canPostMessages',
  'canEditMessages',
  'canManageDirectMessages',
  'canManageTags',
  'canSendWelcomeMessages',
] as const;

/**
 * Копирует заданные boolean-поля узла в запись синонима.
 * @param data - Данные узла
 * @returns Только те права, которые явно заданы
 */
function pickBoolFields(data: Node['data']): Partial<SynonymEntry> {
  const source = data as Record<string, unknown>;
  const picked: Partial<SynonymEntry> = {};
  for (const key of PASSTHROUGH_BOOL_KEYS) {
    if (typeof source[key] === 'boolean') {
      picked[key] = source[key] as boolean;
    }
  }
  return picked;
}

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

  const entries: SynonymEntry[] = [];

  for (const node of validNodes) {
    for (const synonym of node.data.synonyms as string[]) {
      const base = { synonym, nodeId: node.id, nodeType: node.type as SynonymEntry['nodeType'] };

      if (node.type === NODE_TYPES.MESSAGE) {
        entries.push(base);

      } else if (['pin_message', 'unpin_message', 'delete_message'].includes(node.type)) {
        entries.push({
          ...base,
          messageText: node.data.messageText,
          disableNotification: node.data.disableNotification,
        });

      } else if (USER_MANAGEMENT_TYPES.has(node.type as any)) {
        const data = stripLegacyMediaPermission(node.data);
        entries.push({
          ...base,
          reason: data.reason,
          untilDate: data.untilDate,
          duration: data.duration,
          ...pickBoolFields(data),
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
  const prepared = {
    ...params,
    synonyms: params.synonyms.map((entry) => stripLegacyMediaPermission(entry)),
  };
  const validated = synonymsParamsSchema.parse(prepared);
  const synonymEntries = validated.synonyms.map((entry) => omitUndefined(entry));
  return renderPartialTemplate('synonyms/synonyms.py.jinja2', { synonymEntries });
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
