/**
 * @fileoverview Sync synonyms with text_trigger nodes on the canvas.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';

interface UseSynonymSyncProps {
  selectedNode: Node;
  allNodes: Node[];
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  onNodeAdd?: (node: Node) => void;
  onNodeDelete?: (nodeId: string) => void;
}

function getTextSynonyms(node: Node): string[] {
  return Array.isArray((node.data as any).textSynonyms)
    ? ((node.data as any).textSynonyms as string[])
    : [];
}

export function useSynonymSync({
  selectedNode,
  allNodes,
  onNodeUpdate,
  onNodeAdd,
  onNodeDelete,
}: UseSynonymSyncProps) {
  const normalizeSynonym = useCallback((value: string) => value.trim().toLowerCase(), []);

  const linkedTextTriggers = useMemo(() => {
    return allNodes.filter(node =>
      node.type === 'text_trigger' &&
      (node.data as any).autoTransitionTo === selectedNode.id
    );
  }, [allNodes, selectedNode.id]);

  const displaySynonyms = useMemo(() => {
    const result: string[] = [];
    const seen = new Set<string>();

    const pushUnique = (value: string) => {
      const normalized = normalizeSynonym(value);
      if (!value.length) {
        result.push(value);
        return;
      }
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      result.push(value);
    };

    (selectedNode.data.synonyms || []).forEach(pushUnique);
    linkedTextTriggers.forEach(trigger => {
      getTextSynonyms(trigger).forEach(pushUnique);
    });

    return result;
  }, [selectedNode.data.synonyms, linkedTextTriggers, normalizeSynonym]);

  const findTriggerForSynonym = useCallback((synonym: string): Node | undefined => {
    const normalizedSynonym = normalizeSynonym(synonym);

    return allNodes.find(node =>
      node.type === 'text_trigger' &&
      (node.data as any).autoTransitionTo === selectedNode.id &&
      getTextSynonyms(node).length === 1 &&
      normalizeSynonym(getTextSynonyms(node)[0] || '') === normalizedSynonym
    );
  }, [allNodes, selectedNode.id, normalizeSynonym]);

  const createTriggerNode = useCallback((synonym: string, offsetIndex: number = 0): Node => {
    return {
      id: `syn-trigger-${nanoid(8)}`,
      type: 'text_trigger',
      position: {
        x: Math.max(20, selectedNode.position.x - 360),
        y: selectedNode.position.y + (linkedTextTriggers.length + offsetIndex) * 120,
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
  }, [linkedTextTriggers.length, selectedNode]);

  useEffect(() => {
    if (!onNodeAdd) {
      return;
    }

    const normalizedLinkedSynonyms = new Set(
      linkedTextTriggers.flatMap((trigger) =>
        getTextSynonyms(trigger).map(normalizeSynonym).filter(Boolean)
      )
    );

    const missingSynonyms = (selectedNode.data.synonyms || []).filter((synonym) => {
      const normalized = normalizeSynonym(synonym);
      return normalized && !normalizedLinkedSynonyms.has(normalized);
    });

    if (missingSynonyms.length === 0) {
      return;
    }

    missingSynonyms.forEach((synonym, index) => {
      onNodeAdd(createTriggerNode(synonym, index));
    });

    onNodeUpdate(selectedNode.id, { synonyms: [] });
  }, [
    createTriggerNode,
    linkedTextTriggers,
    normalizeSynonym,
    onNodeAdd,
    onNodeUpdate,
    selectedNode.id,
    selectedNode.data.synonyms,
  ]);

  const handleSynonymsUpdate = useCallback((newSynonyms: string[]) => {
    const oldSynonyms = displaySynonyms;
    const draftSynonyms = newSynonyms.filter((synonym) => !normalizeSynonym(synonym));

    onNodeUpdate(selectedNode.id, { synonyms: draftSynonyms });

    if (!onNodeAdd || !onNodeDelete) {
      return;
    }

    const handledOld = new Set<string>();
    const handledNew = new Set<string>();

    newSynonyms.forEach((newSynonym, index) => {
      const oldSynonym = oldSynonyms[index];
      if (oldSynonym === undefined || oldSynonym === newSynonym) return;

      const oldNormalized = normalizeSynonym(oldSynonym);
      const newNormalized = normalizeSynonym(newSynonym);
      if (!oldNormalized || !newNormalized) return;

      const trigger = findTriggerForSynonym(oldSynonym);
      if (!trigger) return;

      onNodeUpdate(trigger.id, { textSynonyms: [newSynonym] });
      handledOld.add(oldNormalized);
      handledNew.add(newNormalized);
    });

    const added = newSynonyms.filter(synonym => {
      const normalized = normalizeSynonym(synonym);
      if (!normalized || handledNew.has(normalized)) return false;
      return !oldSynonyms.some(old => normalizeSynonym(old) === normalized);
    });

    const removed = oldSynonyms.filter(synonym => {
      const normalized = normalizeSynonym(synonym);
      if (!normalized || handledOld.has(normalized)) return false;
      return !newSynonyms.some(next => normalizeSynonym(next) === normalized);
    });

    added.forEach((synonym, index) => {
      const existing = findTriggerForSynonym(synonym);
      if (!existing) {
        onNodeAdd(createTriggerNode(synonym, index));
      }
    });

    for (const synonym of removed) {
      const trigger = findTriggerForSynonym(synonym);
      if (trigger) {
        onNodeDelete(trigger.id);
      }
    }
  }, [
    createTriggerNode,
    displaySynonyms,
    findTriggerForSynonym,
    normalizeSynonym,
    onNodeAdd,
    onNodeDelete,
    onNodeUpdate,
    selectedNode.id,
  ]);

  return { displaySynonyms, handleSynonymsUpdate };
}
