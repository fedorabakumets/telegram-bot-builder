/**
 * @fileoverview Хук синхронизации команды узла start/command с узлом command_trigger на холсте
 *
 * Если у узла типа `start` или `command` заполнено поле `node.data.command`,
 * автоматически создаёт соответствующий `command_trigger` узел на холсте.
 * При изменении команды — обновляет триггер (удаляет старый, создаёт новый).
 * При очистке команды — удаляет триггер.
 *
 * @module properties/components/synonyms/use-node-command-trigger-sync
 */

import { useEffect } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Пропсы хука useNodeCommandTriggerSync
 */
interface UseNodeCommandTriggerSyncProps {
  /** Текущий узел типа start или command */
  node: Node;
  /** Все узлы холста */
  allNodes: Node[];
  /** Добавить узел на холст */
  onNodeAdd?: (node: Node) => void;
  /** Удалить узел с холста */
  onNodeDelete?: (nodeId: string) => void;
  /** Обновить данные узла (опционально, для обновления без пересоздания) */
  onNodeUpdate?: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Находит command_trigger узел, связанный с данным узлом через autoTransitionTo
 */
function findLinkedCommandTrigger(allNodes: Node[], nodeId: string): Node | undefined {
  return allNodes.find(
    n => n.type === 'command_trigger' && (n.data as any).autoTransitionTo === nodeId
  );
}

/**
 * Создаёт новый command_trigger узел для команды
 */
function createCommandTriggerNode(command: string, sourceNode: Node): Node {
  return {
    id: `cmd-trigger-${nanoid(8)}`,
    type: 'command_trigger',
    position: {
      x: Math.max(20, sourceNode.position.x - 360),
      y: sourceNode.position.y,
    },
    data: {
      command,
      description: (sourceNode.data as any).description || '',
      showInMenu: true,
      isPrivateOnly: false,
      autoTransitionTo: sourceNode.id,
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
}

/**
 * Хук синхронизации команды узла start/command с command_trigger на холсте.
 *
 * Реагирует на изменения `node.data.command` и синхронизирует
 * соответствующий `command_trigger` узел на холсте.
 *
 * @param props - Пропсы хука
 */
export function useNodeCommandTriggerSync({
  node,
  allNodes,
  onNodeAdd,
  onNodeDelete,
  onNodeUpdate,
}: UseNodeCommandTriggerSyncProps): void {
  const command: string = (node.data as any).command || '';

  useEffect(() => {
    if (!onNodeAdd || !onNodeDelete) return;

    const existing = findLinkedCommandTrigger(allNodes, node.id);

    if (!command.trim()) {
      // Команда пустая — удаляем триггер если есть
      if (existing) {
        onNodeDelete(existing.id);
      }
      return;
    }

    if (!existing) {
      // Триггера нет — создаём
      onNodeAdd(createCommandTriggerNode(command, node));
      return;
    }

    if ((existing.data as any).command !== command) {
      // Команда изменилась — пересоздаём или обновляем
      if (onNodeUpdate) {
        onNodeUpdate(existing.id, { command });
      } else {
        onNodeDelete(existing.id);
        onNodeAdd(createCommandTriggerNode(command, node));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command, node.id]);
}
