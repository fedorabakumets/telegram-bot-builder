/**
 * @fileoverview Renderer для шаблона обработчиков управления пользователями
 * @module templates/user-handler/user-handler.renderer
 */

import type { Node } from '@shared/schema';
import type { UserHandlerTemplateParams } from './user-handler.params';
import { userHandlerParamsSchema } from './user-handler.schema';
import { renderPartialTemplate } from '../template-renderer';
import { omitUndefined, stripLegacyMediaPermission } from '../chat-permissions/resolve-mute-media';

/** Права promote, которые попадают в вызов только если уже есть в данных блока */
const OPTIONAL_PROMOTE_KEYS = [
  'canManageChat',
  'canPostMessages',
  'canEditMessages',
  'canManageDirectMessages',
  'canManageTags',
  'canSendWelcomeMessages',
] as const;

/**
 * Оставляет только явно заданные boolean-права.
 * @param data - Данные узла
 * @returns Права, которые нужно передать в promoteChatMember
 */
function pickOptionalPromoteRights(data: Node['data']): Partial<UserHandlerTemplateParams> {
  const source = data as Record<string, unknown>;
  const picked: Partial<UserHandlerTemplateParams> = {};
  for (const key of OPTIONAL_PROMOTE_KEYS) {
    if (typeof source[key] === 'boolean') {
      picked[key] = source[key] as boolean;
    }
  }
  return picked;
}

/**
 * Генерирует Python обработчик управления пользователями из параметров (низкоуровневый API)
 */
export function generateUserHandler(params: UserHandlerTemplateParams): string {
  const validated = userHandlerParamsSchema.parse(stripLegacyMediaPermission(params));
  return renderPartialTemplate(
    'user-handler/user-handler.py.jinja2',
    omitUndefined(validated),
  );
}

/**
 * Собирает параметры UserHandlerTemplateParams из узла графа
 */
export function nodeToUserHandlerParams(node: Node): UserHandlerTemplateParams {
  const data = stripLegacyMediaPermission(node.data);
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const rawSynonyms = data.synonyms as any;

  const synonyms: string[] = Array.isArray(rawSynonyms)
    ? rawSynonyms.map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : typeof rawSynonyms === 'string'
      ? rawSynonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : [];

  const defaults: Record<string, string[]> = {
    ban_user:    ['забанить', 'бан', 'заблокировать'],
    unban_user:  ['разбанить', 'разблокировать', 'unban'],
    mute_user:   ['замутить', 'мут', 'заткнуть'],
    unmute_user: ['размутить', 'размут', 'освободить'],
    promote_user: ['повысить', 'админ', 'назначить'],
    demote_user:  ['понизить', 'снять с админки', 'демоут'],
  };

  return {
    nodeType: node.type as UserHandlerTemplateParams['nodeType'],
    nodeId: node.id,
    safeName,
    synonyms: synonyms.length > 0 ? synonyms : (defaults[node.type] ?? []),
    targetGroupId: data.targetGroupId || '',
    reason: data.reason ? String(data.reason).replace(/"/g, '\\"') : undefined,
    untilDate: data.untilDate ?? 0,
    duration: data.duration ?? 3600,
    canSendMessages: data.canSendMessages ?? false,
    canSendAudios: data.canSendAudios,
    canSendDocuments: data.canSendDocuments,
    canSendPhotos: data.canSendPhotos,
    canSendVideos: data.canSendVideos,
    canSendVideoNotes: data.canSendVideoNotes,
    canSendVoiceNotes: data.canSendVoiceNotes,
    canReactToMessages: data.canReactToMessages,
    canSendPolls: data.canSendPolls ?? false,
    canSendOtherMessages: data.canSendOtherMessages ?? false,
    canAddWebPagePreviews: data.canAddWebPagePreviews ?? false,
    canChangeGroupInfo: data.canChangeGroupInfo ?? false,
    canInviteUsers2: data.canInviteUsers2 ?? false,
    canPinMessages2: data.canPinMessages2 ?? false,
    canChangeInfo: data.canChangeInfo ?? false,
    canDeleteMessages: data.canDeleteMessages ?? true,
    canInviteUsers: data.canInviteUsers ?? true,
    canRestrictMembers: data.canRestrictMembers ?? false,
    canPinMessages: data.canPinMessages ?? true,
    canPromoteMembers: data.canPromoteMembers ?? false,
    canManageVideoChats: data.canManageVideoChats ?? false,
    canManageTopics: data.canManageTopics ?? false,
    isAnonymous: data.isAnonymous ?? false,
    ...pickOptionalPromoteRights(data),
  };
}

/**
 * Генерирует Python обработчики управления пользователями из узла графа (высокоуровневый API).
 * Заменяет generateBanUserHandler, generateUnbanUserHandler и т.д. из bot-generator/UserHandler.
 */
export function generateUserHandlerFromNode(node: Node): string {
  return generateUserHandler(nodeToUserHandlerParams(node));
}
