/**
 * @fileoverview Генерация обработчиков для новых типов узлов через шаблоны
 * @module generate/generate-new-node-handlers
 */

import { Node } from '@shared/schema';
import { generateBroadcastBotFromNode } from '../templates/broadcast-bot/broadcast-bot.renderer';
import { generateBroadcastClientFromNode } from '../templates/broadcast-client/broadcast-client.renderer';
import { generateSticker as generateStickerTemplate } from '../templates/sticker/sticker.renderer';
import { generateVoice as generateVoiceTemplate } from '../templates/voice/voice.renderer';
import { generateCommand as generateCommandTemplate } from '../templates/command/command.renderer';
import { generateStart as generateStartTemplate } from '../templates/start/start.renderer';

/**
 * Генерирует обработчик рассылки (broadcast)
 * @param node - Узел рассылки
 * @param allNodes - Все узлы проекта
 */
export function generateBroadcastHandler(
  node: Node,
  allNodes: Node[] = [],
  _enableComments: boolean = true
): string {
  return node.data?.broadcastApiType === 'client'
    ? generateBroadcastClientFromNode(node, allNodes)
    : generateBroadcastBotFromNode(node, allNodes);
}

/**
 * Генерирует обработчик стикеров (sticker)
 */
export function generateStickerHandler(node: Node): string {
  return generateStickerTemplate({
    nodeId: node.id,
    stickerUrl: node.data?.stickerUrl || '',
    stickerFileId: node.data?.stickerFileId || '',
    stickerSetName: node.data?.stickerSetName || '',
    mediaCaption: node.data?.mediaCaption || '',
    disableNotification: node.data?.disableNotification || false,
  });
}

/**
 * Генерирует обработчик голосовых (voice)
 */
export function generateVoiceHandler(node: Node): string {
  return generateVoiceTemplate({
    nodeId: node.id,
    voiceUrl: node.data?.voiceUrl || '',
    mediaCaption: node.data?.mediaCaption || '',
    mediaDuration: node.data?.mediaDuration || 0,
    disableNotification: node.data?.disableNotification || false,
  });
}

/**
 * Генерирует обработчик команды (command)
 */
export function generateCommandHandler(
  node: Node,
  userDatabaseEnabled: boolean = false
): string {
  return generateCommandTemplate({
    nodeId: node.id,
    command: node.data?.command || '/help',
    messageText: node.data?.messageText || '',
    isPrivateOnly: node.data?.isPrivateOnly || false,
    adminOnly: node.data?.adminOnly || false,
    requiresAuth: node.data?.requiresAuth || false,
    synonyms: node.data?.synonyms || [],
    enableConditionalMessages: node.data?.enableConditionalMessages || false,
    conditionalMessages: node.data?.conditionalMessages || [],
    keyboardType: node.data?.keyboardType || 'none',
    keyboardLayout: node.data?.keyboardLayout,
    oneTimeKeyboard: node.data?.oneTimeKeyboard || false,
    resizeKeyboard: node.data?.resizeKeyboard || true,
    buttons: node.data?.buttons?.map((btn: any) => ({ ...btn, target: btn.target || btn.id || '' })) || [],
    formatMode: node.data?.formatMode || 'none',
    markdown: node.data?.markdown || false,
    fallbackMessage: node.data?.fallbackMessage || '',
    imageUrl: node.data?.imageUrl || '',
    documentUrl: node.data?.documentUrl || '',
    videoUrl: node.data?.videoUrl || '',
    audioUrl: node.data?.audioUrl || '',
    attachedMedia: node.data?.attachedMedia || [],
    userDatabaseEnabled,
  });
}

/**
 * Генерирует обработчик команды /start (start)
 */
export function generateStartHandler(
  node: Node,
  userDatabaseEnabled: boolean = false
): string {
  return generateStartTemplate({
    nodeId: node.id,
    messageText: node.data?.messageText || '',
    isPrivateOnly: node.data?.isPrivateOnly || false,
    adminOnly: node.data?.adminOnly || false,
    requiresAuth: node.data?.requiresAuth || false,
    synonyms: node.data?.synonyms || [],
    allowMultipleSelection: node.data?.allowMultipleSelection || false,
    multiSelectVariable: node.data?.multiSelectVariable || 'selected_options',
    buttons: node.data?.buttons?.map((btn: any) => ({ ...btn, target: btn.target || btn.id || '' })) || [],
    keyboardType: node.data?.keyboardType || 'none',
    keyboardLayout: node.data?.keyboardLayout,
    oneTimeKeyboard: node.data?.oneTimeKeyboard || false,
    resizeKeyboard: node.data?.resizeKeyboard || true,
    enableAutoTransition: node.data?.enableAutoTransition || false,
    autoTransitionTo: node.data?.autoTransitionTo || '',
    collectUserInput: node.data?.collectUserInput || false,
    formatMode: node.data?.formatMode || 'none',
    markdown: node.data?.markdown || false,
    imageUrl: node.data?.imageUrl || '',
    documentUrl: node.data?.documentUrl || '',
    videoUrl: node.data?.videoUrl || '',
    audioUrl: node.data?.audioUrl || '',
    attachedMedia: node.data?.attachedMedia || [],
    userDatabaseEnabled,
  });
}
