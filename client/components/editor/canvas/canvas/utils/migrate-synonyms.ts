/**
 * @fileoverview Миграция устаревшего поля synonyms в узлы text_trigger
 *
 * При загрузке листа проверяет узлы на наличие устаревшего поля synonyms.
 * Если синонимы найдены — создаёт новый узел text_trigger с линией к исходному узлу
 * и очищает synonyms у исходного узла.
 *
 * @module canvas/utils/migrate-synonyms
 */

import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Мигрирует устаревшие синонимы в узлы text_trigger.
 *
 * Для каждого узла у которого есть непустой массив data.synonyms:
 * - создаёт узел text_trigger с теми же текстами
 * - устанавливает autoTransitionTo = исходный узел
 * - размещает левее исходного узла на 360px
 * - очищает synonyms у исходного узла
 *
 * @param nodes - Массив узлов листа
 * @returns Новый массив узлов с добавленными text_trigger и очищенными synonyms
 */
export function migrateSynonymsToTextTriggers(nodes: Node[]): Node[] {
  const result: Node[] = [];
  const newTriggers: Node[] = [];

  for (const node of nodes) {
    const synonyms: string[] = (node.data as any)?.synonyms || [];

    if (synonyms.length === 0) {
      result.push(node);
      continue;
    }

    // Очищаем synonyms у исходного узла
    const cleanedNode: Node = {
      ...node,
      data: {
        ...node.data,
        synonyms: [],
      },
    };
    result.push(cleanedNode);

    // Создаём text_trigger узел
    const matchMode = (node.data as any)?.matchMode || 'exact';
    const triggerNode: Node = {
      id: `migrated-trigger-${nanoid(8)}`,
      type: 'text_trigger',
      position: {
        x: Math.max(20, node.position.x - 360),
        y: node.position.y,
      },
      data: {
        textSynonyms: synonyms,
        textMatchType: matchMode === 'fuzzy' ? 'contains' : matchMode,
        autoTransitionTo: node.id,
        synonyms: [],
        buttons: [],
        keyboardType: 'none',
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        formatMode: 'none',
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        showInMenu: true,
        enableStatistics: true,
        enableAutoTransition: false,
        collectUserInput: false,
        saveToDatabase: false,
        allowSkip: false,
        appendVariable: false,
        variableFilters: {},
        enableUserActions: false,
        silentAction: false,
        allowsMultipleAnswers: false,
        anonymousVoting: true,
        allowMultipleSelection: false,
        inputRequired: true,
        responseType: 'text',
        responseOptions: [],
        conditionalMessages: [],
        enableConditionalMessages: false,
        customParameters: [],
        options: [],
        attachedMedia: [],
        messageIdSource: 'last_message',
        userIdSource: 'last_message',
        mapService: 'custom',
        mapZoom: 15,
        showDirections: false,
        generateMapPreview: true,
        inputType: 'text',
        inputButtonType: 'inline',
        canChangeInfo: false,
        canDeleteMessages: false,
        canBanUsers: false,
        canInviteUsers: false,
        canPinMessages: false,
        canAddAdmins: false,
        canRestrictMembers: false,
        canPromoteMembers: false,
        canManageVideoChats: false,
        canManageTopics: false,
        isAnonymous: false,
        canSendMessages: true,
        canSendMediaMessages: true,
        canSendPolls: true,
        canSendOtherMessages: true,
        canAddWebPagePreviews: true,
        canChangeGroupInfo: true,
        canInviteUsers2: true,
        canPinMessages2: true,
        adminUserIdSource: 'last_message',
        can_manage_chat: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_delete_messages: false,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
        can_manage_video_chats: false,
        can_restrict_members: false,
        can_promote_members: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_manage_topics: false,
        is_anonymous: false,
        adminChatIdSource: 'current_chat',
      },
    };

    newTriggers.push(triggerNode);
  }

  return [...result, ...newTriggers];
}
