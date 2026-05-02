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

function hasTriggerableCommand(node: Node): boolean {
  if (node.type === 'command_trigger' || node.type === 'text_trigger') {
    return false;
  }

  const command: string = (node.data as any)?.command || '';
  return Boolean(command.trim());
}

function getCommandTriggerPosition(node: Node, nodes: Node[], appendedTriggers: Node[]): { x: number; y: number } {
  const linkedTextTriggersCount =
    nodes.filter((n) => n.type === 'text_trigger' && (n.data as any).autoTransitionTo === node.id).length +
    appendedTriggers.filter((n) => n.type === 'text_trigger' && (n.data as any).autoTransitionTo === node.id).length;

  const linkedCommandTriggersCount =
    nodes.filter((n) => n.type === 'command_trigger' && (n.data as any).sourceNodeId === node.id).length +
    appendedTriggers.filter((n) => n.type === 'command_trigger' && (n.data as any).sourceNodeId === node.id).length;

  return {
    x: Math.max(20, node.position.x - 360),
    y: node.position.y - ((linkedTextTriggersCount > 0 ? linkedCommandTriggersCount + 1 : linkedCommandTriggersCount) * 120),
  };
}

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
  /**
   * Дедупликация: если для одной команды есть несколько command_trigger узлов —
   * оставляем только тот у которого autoTransitionTo указывает НЕ на start/command узел
   * (т.е. уже перенаправлен на condition), либо первый найденный.
   *
   * Узлы с разными deepLinkParam считаются разными точками входа и не дедуплицируются —
   * это позволяет иметь несколько /start узлов с разными deep link параметрами.
   */
  const sourceNodeIds = new Set(
    nodes.filter(hasTriggerableCommand).map(n => n.id)
  );
  const seenCommands = new Map<string, string>(); // "command::deepLinkParam" → id первого триггера
  const deduped = nodes.filter(n => {
    if (n.type !== 'command_trigger') return true;
    const cmd: string = (n.data as any).command || '';
    if (!cmd) return true;
    /** Ключ дедупликации: команда + deepLinkParam — узлы с разными параметрами не дедуплицируются */
    const deepLinkParam: string = (n.data as any).deepLinkParam || '';
    const dedupKey = `${cmd}::${deepLinkParam}`;
    const autoTo: string = (n.data as any).autoTransitionTo || '';
    // Предпочитаем триггер у которого autoTransitionTo НЕ ведёт на start/command узел
    if (!seenCommands.has(dedupKey)) {
      seenCommands.set(dedupKey, n.id);
      return true;
    }
    // Уже есть триггер для этой команды с таким же deepLinkParam — оставляем "лучший"
    const existingId = seenCommands.get(dedupKey)!;
    const existing = nodes.find(x => x.id === existingId)!;
    const existingAutoTo: string = (existing.data as any).autoTransitionTo || '';
    // Если текущий ведёт на condition (не на start/command) — он лучше
    if (!sourceNodeIds.has(autoTo) && sourceNodeIds.has(existingAutoTo)) {
      seenCommands.set(dedupKey, n.id);
      // Удаляем старый из результата — заменяем текущим
      return true;
    }
    return false;
  });
  // Убираем вытесненные дубли
  const keepIds = new Set(seenCommands.values());
  const result: Node[] = deduped.filter(n =>
    n.type !== 'command_trigger' || keepIds.has(n.id)
  );
  const newTriggers: Node[] = [];

  for (const node of nodes) {
    if (!hasTriggerableCommand(node)) continue;

    const command: string = (node.data as any)?.command || '';

    // Проверяем: уже есть command_trigger для этого узла?
    // Проверяем по sourceNodeId (новые узлы), по autoTransitionTo (старые сохранённые узлы
    // до добавления sourceNodeId), и по совпадению команды (крайний fallback).
    const alreadyExists = result.some(n => {
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
      position: getCommandTriggerPosition(node, nodes, newTriggers),
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
