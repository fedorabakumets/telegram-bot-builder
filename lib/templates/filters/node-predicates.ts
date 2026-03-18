/**
 * @fileoverview Предикаты узлов — функции проверки свойств массивов узлов
 */

import type { BotNode } from '../../bot-generator/types';
import { NODE_TYPES } from '../../bot-generator/types';
import type { InputCollectionCheckResult } from '../../bot-generator/types/input-collection-check-result';
import type { Node } from '@shared/schema';
import type { Button } from '@shared/schema';

/**
 * Проверяет наличие автопереходов в массиве узлов
 */
export function hasAutoTransitions(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enableAutoTransition && node.data?.autoTransitionTo);
}

/**
 * Проверяет наличие кнопок-команд в массиве узлов
 */
export function hasCommandButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  const hasRegularCommandButtons = nodes.some(node => {
    if (!node.data.buttons || !Array.isArray(node.data.buttons)) return false;
    return node.data.buttons.some((button: Button) => button.action === 'goto' && button.target && button.target.startsWith('/'));
  });

  const hasConditionalCommandButtons = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      return cond.buttons.some((button: Button) => button.action === 'goto' && !cond.variableName && !cond.variableNames && button.target && button.target.startsWith('/'));
    });
  });

  return hasRegularCommandButtons || hasConditionalCommandButtons;
}

/**
 * Проверяет узлы на наличие сбора пользовательского ввода за ОДИН проход
 */
export function hasInputCollection(nodes: BotNode[]): InputCollectionCheckResult {
  if (!nodes || nodes.length === 0) {
    return {
      hasCollectInput: false,
      hasTextInput: false,
      hasPhotoInput: false,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: false,
      hasConditionalInput: false,
      hasMultiSelect: false,
      hasAnyInput: false,
    };
  }

  const result: InputCollectionCheckResult = {
    hasCollectInput: false,
    hasTextInput: false,
    hasPhotoInput: false,
    hasVideoInput: false,
    hasAudioInput: false,
    hasDocumentInput: false,
    hasConditionalInput: false,
    hasMultiSelect: false,
    hasAnyInput: false,
  };

  for (const node of nodes) {
    if (!node) continue;
    const data = node.data || {};
    if (data.collectUserInput) result.hasCollectInput = true;
    if (data.enableTextInput) result.hasTextInput = true;
    if (data.enablePhotoInput) result.hasPhotoInput = true;
    if (data.enableVideoInput) result.hasVideoInput = true;
    if (data.enableAudioInput) result.hasAudioInput = true;
    if (data.enableDocumentInput) result.hasDocumentInput = true;
    if (data.allowMultipleSelection === true) result.hasMultiSelect = true;
    if (data.enableAutoTransition && data.autoTransitionTo) result.hasCollectInput = true;
    const conditions = data.conditionalMessages;
    if (conditions?.some((cond: any) => cond.waitForTextInput)) {
      result.hasConditionalInput = true;
    }
  }

  result.hasAnyInput =
    result.hasCollectInput ||
    result.hasTextInput ||
    result.hasPhotoInput ||
    result.hasVideoInput ||
    result.hasAudioInput ||
    result.hasDocumentInput ||
    result.hasConditionalInput ||
    result.hasMultiSelect;

  return result;
}

/**
 * Проверяет наличие узлов, требующих функцию safe_edit_or_send
 */
export function hasNodesRequiringSafeEditOrSend(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => {
    const nodeTypesRequiringSafeEditOrSend = [
      'admin_rights', 'ban_user', 'unban_user', 'mute_user',
      'unmute_user', 'kick_user', 'promote_user', 'demote_user'
    ];
    const hasMultipleSelection = node.data && node.data.allowMultipleSelection === true;
    return nodeTypesRequiringSafeEditOrSend.includes(node.type) || hasMultipleSelection;
  });
}

/**
 * Проверяет наличие узлов с imageUrl/videoUrl/audioUrl/documentUrl начинающимся на '/uploads/'
 */
export function hasUploadImageUrls(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node =>
    node &&
    ((node.data?.imageUrl && typeof node.data.imageUrl === 'string' && node.data.imageUrl.startsWith('/uploads/')) ||
     (node.data?.videoUrl && typeof node.data.videoUrl === 'string' && node.data.videoUrl.startsWith('/uploads/')) ||
     (node.data?.audioUrl && typeof node.data.audioUrl === 'string' && node.data.audioUrl.startsWith('/uploads/')) ||
     (node.data?.documentUrl && typeof node.data.documentUrl === 'string' && node.data.documentUrl.startsWith('/uploads/')) ||
     (node.data?.attachedMedia && Array.isArray(node.data.attachedMedia) &&
      node.data.attachedMedia.some((media: any) => typeof media === 'string' && media.startsWith('/uploads/'))))
  );
}

/**
 * Проверяет наличие медиа-узлов по типам узлов И по data полям
 */
export function hasMediaNodes(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node =>
    node &&
    (node.type === NODE_TYPES.ANIMATION ||
    node.type === NODE_TYPES.PHOTO ||
    node.type === NODE_TYPES.VIDEO ||
    node.type === NODE_TYPES.AUDIO ||
    node.type === NODE_TYPES.DOCUMENT ||
    node.data?.imageUrl ||
    node.data?.videoUrl ||
    node.data?.audioUrl ||
    node.data?.documentUrl ||
    node.data?.enablePhotoInput ||
    node.data?.enableVideoInput ||
    node.data?.enableAudioInput ||
    node.data?.enableDocumentInput ||
    (node.data?.attachedMedia && Array.isArray(node.data.attachedMedia) && node.data.attachedMedia.length > 0))
  );
}

export type { InputCollectionCheckResult };
