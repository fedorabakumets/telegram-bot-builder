/**
 * @fileoverview Миграция узлов start/command в узлы command_trigger при загрузке листа
 *
 * При загрузке листа проверяет узлы типа `start` и `command` на наличие поля `data.command`.
 * Если команда заполнена и соответствующего `command_trigger` ещё нет — создаёт его.
 * Это обеспечивает совместимость: старые листы без `command_trigger` узлов
 * автоматически получают их при открытии.
 *
 * @module canvas/utils/migrate-command-triggers
 */

import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Мигрирует узлы start/command в command_trigger узлы при загрузке листа.
 *
 * Для каждого узла типа `start` или `command` с непустым `data.command`:
 * - проверяет, не существует ли уже `command_trigger` с `sourceNodeId === node.id`
 * - если не существует — создаёт `command_trigger` левее исходного узла на 360px
 *
 * Проверка ведётся по полю `sourceNodeId`, а не `autoTransitionTo`, потому что
 * после миграции условных сообщений (`migrateConditionalMessagesToConditionNodes`)
 * поле `autoTransitionTo` у триггера может быть перенаправлено на `condition`-узел,
 * и проверка по `autoTransitionTo === node.id` ложно не находила бы существующий триггер.
 *
 * @param nodes - Массив узлов листа
 * @returns Новый массив узлов с добавленными command_trigger (исходные узлы не изменены)
 */
export function migrateCommandsToCommandTriggers(nodes: Node[]): Node[] {
  const result: Node[] = [...nodes];
  const newTriggers: Node[] = [];

  for (const node of nodes) {
    if (node.type !== 'start' && node.type !== 'command') continue;

    const command: string = (node.data as any)?.command || '';
    if (!command.trim()) continue;

    // Проверяем: уже есть command_trigger для этого узла?
    // Проверяем по sourceNodeId (новые узлы), по autoTransitionTo (старые сохранённые узлы
    // до добавления sourceNodeId), и по совпадению команды (крайний fallback).
    const alreadyExists = nodes.some(n => {
      if (n.type !== 'command_trigger') return false;
      const d = n.data as any;
      return d.sourceNodeId === node.id
        || d.autoTransitionTo === node.id
        || (d.command === command && !d.sourceNodeId);
    });

    if (alreadyExists) continue;

    const triggerNode: Node = {
      id: `cmd-trigger-${nanoid(8)}`,
      type: 'command_trigger',
      position: {
        x: Math.max(20, node.position.x - 360),
        y: node.position.y,
      },
      data: {
        command,
        description: (node.data as any).description || '',
        showInMenu: true,
        isPrivateOnly: false,
        autoTransitionTo: node.id,
        /** Стабильная ссылка на исходный узел — используется для проверки дублирования.
         *  Не меняется при последующих миграциях (в отличие от autoTransitionTo). */
        sourceNodeId: node.id,
        synonyms: [],
        buttons: [],
        keyboardType: 'none',
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        formatMode: 'none',
        adminOnly: false,
        requiresAuth: false,
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
        textSynonyms: [],
        textMatchType: 'exact',
      } as any,
    };

    newTriggers.push(triggerNode);
  }

  return [...result, ...newTriggers];
}
