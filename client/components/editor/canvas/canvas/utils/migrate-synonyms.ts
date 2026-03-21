/**
 * @fileoverview Миграция устаревшего поля synonyms в узлы text_trigger
 *
 * При загрузке листа проверяет узлы на наличие устаревшего поля synonyms.
 * Если синонимы найдены — создаёт отдельный узел text_trigger для каждого синонима
 * с линией к исходному узлу. Исходный узел НЕ изменяется — synonyms остаются
 * как источник истины для отображения в панели свойств.
 *
 * @module canvas/utils/migrate-synonyms
 */

import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Мигрирует устаревшие синонимы в узлы text_trigger.
 *
 * Для каждого синонима из data.synonyms исходного узла:
 * - проверяет, не существует ли уже text_trigger с этим синонимом и autoTransitionTo === node.id
 * - если не существует — создаёт отдельный узел text_trigger (один синоним = один триггер)
 * - размещает триггер левее исходного узла на 360px, смещая по Y на 120px для каждого следующего
 * - исходный узел остаётся без изменений (synonyms не очищаются)
 *
 * @param nodes - Массив узлов листа
 * @returns Новый массив узлов с добавленными text_trigger (исходные узлы не изменены)
 */
export function migrateSynonymsToTextTriggers(nodes: Node[]): Node[] {
  // Исходные узлы без изменений — synonyms остаются как источник истины
  const result: Node[] = [...nodes];
  const newTriggers: Node[] = [];

  for (const node of nodes) {
    const synonyms: string[] = (node.data as any)?.synonyms || [];
    if (synonyms.length === 0) continue;

    const matchMode = (node.data as any)?.matchMode || 'exact';

    for (const synonym of synonyms) {
      if (!synonym.trim()) continue;

      // Проверяем: уже есть text_trigger для этого синонима и этого узла?
      const alreadyExists = nodes.some(n =>
        n.type === 'text_trigger' &&
        (n.data as any).autoTransitionTo === node.id &&
        Array.isArray((n.data as any).textSynonyms) &&
        (n.data as any).textSynonyms.includes(synonym)
      );

      if (alreadyExists) continue;

      // Считаем смещение по Y: учитываем уже существующие триггеры + только что созданные
      const existingCount =
        nodes.filter(n =>
          n.type === 'text_trigger' &&
          (n.data as any).autoTransitionTo === node.id
        ).length +
        newTriggers.filter(n =>
          (n.data as any).autoTransitionTo === node.id
        ).length;

      const triggerNode: Node = {
        id: `migrated-trigger-${nanoid(8)}`,
        type: 'text_trigger',
        position: {
          x: Math.max(20, node.position.x - 360),
          y: node.position.y + existingCount * 120,
        },
        data: {
          textSynonyms: [synonym],
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
  }

  return [...result, ...newTriggers];
}
