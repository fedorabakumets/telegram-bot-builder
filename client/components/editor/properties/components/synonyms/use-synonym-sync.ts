/**
 * @fileoverview Хук синхронизации синонимов с узлами text_trigger на холсте
 *
 * При изменении массива synonyms у узла автоматически создаёт/удаляет/обновляет
 * соответствующие узлы text_trigger на холсте.
 *
 * @module properties/components/synonyms/use-synonym-sync
 */

import { useCallback } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Пропсы хука useSynonymSync
 */
interface UseSynonymSyncProps {
  /** Текущий узел (source) */
  selectedNode: Node;
  /** Все узлы листа */
  allNodes: Node[];
  /** Обновить данные узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Добавить узел на холст */
  onNodeAdd?: (node: Node) => void;
  /** Удалить узел с холста */
  onNodeDelete?: (nodeId: string) => void;
}

/**
 * Хук синхронизации синонимов с text_trigger узлами
 *
 * @param props - Пропсы хука
 * @returns handleSynonymsUpdate — функция для передачи в SynonymEditor вместо прямого onUpdate
 */
export function useSynonymSync({
  selectedNode,
  allNodes,
  onNodeUpdate,
  onNodeAdd,
  onNodeDelete,
}: UseSynonymSyncProps) {

  /**
   * Находит text_trigger узел связанный с данным синонимом и source-узлом
   */
  const findTriggerForSynonym = useCallback((synonym: string): Node | undefined => {
    return allNodes.find(n =>
      n.type === 'text_trigger' &&
      (n.data as any).autoTransitionTo === selectedNode.id &&
      Array.isArray((n.data as any).textSynonyms) &&
      (n.data as any).textSynonyms.length === 1 &&
      (n.data as any).textSynonyms[0] === synonym
    );
  }, [allNodes, selectedNode.id]);

  /**
   * Создаёт новый text_trigger узел для синонима
   */
  const createTriggerNode = useCallback((synonym: string): Node => {
    // Считаем сколько уже есть триггеров для этого узла — смещаем по Y
    const existingTriggers = allNodes.filter(n =>
      n.type === 'text_trigger' &&
      (n.data as any).autoTransitionTo === selectedNode.id
    );
    const yOffset = existingTriggers.length * 120;

    return {
      id: `syn-trigger-${nanoid(8)}`,
      type: 'text_trigger',
      position: {
        x: Math.max(20, selectedNode.position.x - 360),
        y: selectedNode.position.y + yOffset,
      },
      data: {
        textSynonyms: [synonym],
        textMatchType: 'exact',
        autoTransitionTo: selectedNode.id,
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
      } as any,
    };
  }, [allNodes, selectedNode]);

  /**
   * Обработчик изменения массива синонимов.
   * Вызывается вместо прямого onUpdate в SynonymEditor.
   *
   * Сравнивает старый и новый массив, синхронизирует text_trigger узлы.
   */
  const handleSynonymsUpdate = useCallback((newSynonyms: string[]) => {
    const oldSynonyms: string[] = selectedNode.data.synonyms || [];

    // Обновляем данные узла
    onNodeUpdate(selectedNode.id, { synonyms: newSynonyms });

    if (!onNodeAdd || !onNodeDelete) return;

    // Добавленные синонимы (есть в новом, нет в старом, непустые)
    const added = newSynonyms.filter(s => s.trim() && !oldSynonyms.includes(s));
    // Удалённые синонимы (есть в старом, нет в новом, непустые)
    const removed = oldSynonyms.filter(s => s.trim() && !newSynonyms.includes(s));

    // Создаём триггеры для новых синонимов
    for (const synonym of added) {
      const existing = findTriggerForSynonym(synonym);
      if (!existing) {
        onNodeAdd(createTriggerNode(synonym));
      }
    }

    // Удаляем триггеры для удалённых синонимов
    for (const synonym of removed) {
      const trigger = findTriggerForSynonym(synonym);
      if (trigger) {
        onNodeDelete(trigger.id);
      }
    }
  }, [selectedNode, onNodeUpdate, onNodeAdd, onNodeDelete, findTriggerForSynonym, createTriggerNode]);

  return { handleSynonymsUpdate };
}
