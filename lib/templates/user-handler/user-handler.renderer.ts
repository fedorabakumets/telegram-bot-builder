/**
 * @fileoverview Renderer для шаблона обработчиков управления пользователями
 * @module templates/user-handler/user-handler.renderer
 */

import type { Node } from '@shared/schema';
import type { UserHandlerTemplateParams } from './user-handler.params';
import { userHandlerParamsSchema } from './user-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python обработчик управления пользователями из параметров (низкоуровневый API)
 */
export function generateUserHandler(params: UserHandlerTemplateParams): string {
  const validated = userHandlerParamsSchema.parse(params);
  return renderPartialTemplate('user-handler/user-handler.py.jinja2', validated);
}

/**
 * Собирает параметры UserHandlerTemplateParams из узла графа
 */
export function nodeToUserHandlerParams(node: Node): UserHandlerTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const rawSynonyms = node.data.synonyms;

  const synonyms: string[] = Array.isArray(rawSynonyms)
    ? rawSynonyms.map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : typeof rawSynonyms === 'string'
      ? rawSynonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : [];

  const defaults: Record<string, string[]> = {
    ban_user:    ['забанить', 'бан', 'заблокировать'],
    unban_user:  ['разбанить', 'разблокировать', 'unban'],
    kick_user:   ['кикнуть', 'кик', 'исключить'],
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
    targetGroupId: node.data.targetGroupId || '',
    reason: node.data.reason ? String(node.data.reason).replace(/"/g, '\\"') : undefined,
    untilDate: node.data.untilDate ?? 0,
    duration: node.data.duration ?? 3600,
    canSendMessages: node.data.canSendMessages ?? false,
    canSendMediaMessages: node.data.canSendMediaMessages ?? false,
    canSendPolls: node.data.canSendPolls ?? false,
    canSendOtherMessages: node.data.canSendOtherMessages ?? false,
    canAddWebPagePreviews: node.data.canAddWebPagePreviews ?? false,
    canChangeGroupInfo: node.data.canChangeGroupInfo ?? false,
    canInviteUsers2: node.data.canInviteUsers2 ?? false,
    canPinMessages2: node.data.canPinMessages2 ?? false,
    canChangeInfo: node.data.canChangeInfo ?? false,
    canDeleteMessages: node.data.canDeleteMessages ?? true,
    canInviteUsers: node.data.canInviteUsers ?? true,
    canRestrictMembers: node.data.canRestrictMembers ?? false,
    canPinMessages: node.data.canPinMessages ?? true,
    canPromoteMembers: node.data.canPromoteMembers ?? false,
    canManageVideoChats: node.data.canManageVideoChats ?? false,
    canManageTopics: node.data.canManageTopics ?? false,
    isAnonymous: node.data.isAnonymous ?? false,
  };
}

/**
 * Генерирует Python обработчики управления пользователями из узла графа (высокоуровневый API).
 * Заменяет generateBanUserHandler, generateUnbanUserHandler и т.д. из bot-generator/UserHandler.
 */
export function generateUserHandlerFromNode(node: Node): string {
  return generateUserHandler(nodeToUserHandlerParams(node));
}
