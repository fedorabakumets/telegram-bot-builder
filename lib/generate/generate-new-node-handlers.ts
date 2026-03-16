/**
 * @fileoverview Генерация обработчиков для новых типов узлов через шаблоны
 * @module generate/generate-new-node-handlers
 */

import { Node } from '@shared/schema';
import { generateBroadcast as generateBroadcastTemplate } from '../bot-generator/templates/broadcast/broadcast.renderer';
import { generateSticker as generateStickerTemplate } from '../bot-generator/templates/sticker/sticker.renderer';
import { generateVoice as generateVoiceTemplate } from '../bot-generator/templates/voice/voice.renderer';
import { generateCommand as generateCommandTemplate } from '../bot-generator/templates/command/command.renderer';
import { generateStart as generateStartTemplate } from '../bot-generator/templates/start/start.renderer';

/**
 * Генерирует обработчик рассылки (broadcast)
 * @param node - Узел рассылки
 * @param _enableCommentss - Включить ли комментарии
 * @returns Сгенерированный Python код
 */
export function generateBroadcastHandler(
  node: Node,
  _enableCommentss: boolean = true
): string {
  const params = {
    nodeId: node.id,
    broadcastApiType: node.data?.broadcastApiType || 'bot',
    broadcastTargetNode: node.data?.broadcastTargetNode || '',
    enableBroadcast: node.data?.enableBroadcast || false,
    enableConfirmation: node.data?.enableConfirmation || false,
    confirmationText: node.data?.confirmationText || '',
    successMessage: node.data?.successMessage || '',
    errorMessage: node.data?.errorMessage || '',
    idSourceType: node.data?.idSourceType || 'bot_users',
    messageText: node.data?.messageText || '',
  };

  return generateBroadcastTemplate(params);
}

/**
 * Генерирует обработчик стикеров (sticker)
 * @param node - Узел стикера
 * @returns Сгенерированный Python код
 */
export function generateStickerHandler(node: Node): string {
  const params = {
    nodeId: node.id,
    stickerUrl: node.data?.stickerUrl || '',
    stickerFileId: node.data?.stickerFileId || '',
    stickerSetName: node.data?.stickerSetName || '',
    mediaCaption: node.data?.mediaCaption || '',
    disableNotification: node.data?.disableNotification || false,
  };

  return generateStickerTemplate(params);
}

/**
 * Генерирует обработчик голосовых (voice)
 * @param node - Узел голосового сообщения
 * @returns Сгенерированный Python код
 */
export function generateVoiceHandler(node: Node): string {
  const params = {
    nodeId: node.id,
    voiceUrl: node.data?.voiceUrl || '',
    mediaCaption: node.data?.mediaCaption || '',
    mediaDuration: node.data?.mediaDuration || 0,
    disableNotification: node.data?.disableNotification || false,
  };

  return generateVoiceTemplate(params);
}



/**
 * Генерирует обработчик команды (command)
 * @param node - Узел команды
 * @param userDatabaseEnabled - Включена ли БД пользователей
 * @returns Сгенерированный Python код
 */
export function generateCommandHandler(
  node: Node,
  userDatabaseEnabled: boolean = false
): string {
  const params = {
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
    buttons: node.data?.buttons?.map(btn => ({
      ...btn,
      target: btn.target || btn.id || '',
    })) || [],
    formatMode: node.data?.formatMode || 'none',
    markdown: node.data?.markdown || false,
    fallbackMessage: node.data?.fallbackMessage || '',
    imageUrl: node.data?.imageUrl || '',
    documentUrl: node.data?.documentUrl || '',
    videoUrl: node.data?.videoUrl || '',
    audioUrl: node.data?.audioUrl || '',
    attachedMedia: node.data?.attachedMedia || [],
    userDatabaseEnabled,
  };

  return generateCommandTemplate(params);
}

/**
 * Генерирует обработчик команды /start (start)
 * @param node - Узел команды /start
 * @param userDatabaseEnabled - Включена ли БД пользователей
 * @returns Сгенерированный Python код
 */
export function generateStartHandler(
  node: Node,
  userDatabaseEnabled: boolean = false
): string {
  const params = {
    nodeId: node.id,
    messageText: node.data?.messageText || '',
    isPrivateOnly: node.data?.isPrivateOnly || false,
    adminOnly: node.data?.adminOnly || false,
    requiresAuth: node.data?.requiresAuth || false,
    synonyms: node.data?.synonyms || [],
    allowMultipleSelection: node.data?.allowMultipleSelection || false,
    multiSelectVariable: node.data?.multiSelectVariable || 'selected_options',
    buttons: node.data?.buttons?.map(btn => ({
      ...btn,
      target: btn.target || btn.id || '',
    })) || [],
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
  };

  return generateStartTemplate(params);
}
