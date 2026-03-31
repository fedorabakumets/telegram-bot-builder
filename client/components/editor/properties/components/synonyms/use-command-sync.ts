/**
 * @fileoverview Хук синхронизации команд с узлами command_trigger на холсте
 *
 * При изменении списка команд у узла автоматически создаёт/удаляет
 * соответствующие узлы command_trigger на холсте.
 *
 * @module properties/components/synonyms/use-command-sync
 */

import { useCallback } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Пропсы хука useCommandSync
 */
interface UseCommandSyncProps {
  /** Текущий узел (тип text_trigger) */
  node: Node;
  /** Все узлы холста */
  allNodes: Node[];
  /** Добавить узел на холст */
  onNodeAdd?: (node: Node) => void;
  /** Удалить узел с холста */
  onNodeDelete?: (nodeId: string) => void;
}

/**
 * Хук синхронизации команд с command_trigger узлами
 *
 * @param props - Пропсы хука
 * @returns handleCommandAdd — добавить команду, handleCommandDelete — удалить команду, commands — текущий список команд
 */
export function useCommandSync({
  node,
  allNodes,
  onNodeAdd,
  onNodeDelete,
}: UseCommandSyncProps) {

  /**
   * Возвращает все command_trigger узлы, связанные с текущим узлом
   */
  const getLinkedCommandTriggers = useCallback((): Node[] => {
    return allNodes.filter(n =>
      n.type === 'command_trigger' &&
      (n.data as any).autoTransitionTo === node.id
    );
  }, [allNodes, node.id]);

  /**
   * Создаёт новый command_trigger узел для команды
   */
  const createCommandTriggerNode = useCallback((command: string): Node => {
    const existingCommandTriggers = allNodes.filter(n =>
      n.type === 'command_trigger' &&
      (n.data as any).autoTransitionTo === node.id
    );
    const linkedTextTriggersCount = allNodes.filter(n =>
      n.type === 'text_trigger' &&
      (n.data as any).autoTransitionTo === node.id
    ).length;

    return {
      id: `cmd-trigger-${nanoid(8)}`,
      type: 'command_trigger',
      position: {
        x: Math.max(20, node.position.x - 360),
        y: node.position.y - ((linkedTextTriggersCount > 0 ? existingCommandTriggers.length + 1 : existingCommandTriggers.length) * 120),
      },
      data: {
        command,
        description: '',
        showInMenu: true,
        isPrivateOnly: false,
        autoTransitionTo: node.id,
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
  }, [allNodes, node]);

  /**
   * Добавляет новую команду — создаёт command_trigger узел на холсте
   *
   * @param command - Текст команды (например "/start")
   */
  const handleCommandAdd = useCallback((command: string) => {
    if (!onNodeAdd || !command.trim()) return;
    onNodeAdd(createCommandTriggerNode(command));
  }, [onNodeAdd, createCommandTriggerNode]);

  /**
   * Удаляет команду — удаляет соответствующий command_trigger узел с холста
   *
   * @param triggerId - ID узла command_trigger для удаления
   */
  const handleCommandDelete = useCallback((triggerId: string) => {
    if (!onNodeDelete) return;
    onNodeDelete(triggerId);
  }, [onNodeDelete]);

  return {
    /** Список связанных command_trigger узлов */
    commandTriggers: getLinkedCommandTriggers(),
    handleCommandAdd,
    handleCommandDelete,
  };
}
