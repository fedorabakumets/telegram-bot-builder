/**
 * @fileoverview Генерация обработчиков для новых типов узлов через шаблоны
 * @module generate/generate-new-node-handlers
 */

import { Node } from '@shared/schema';
import { generateBroadcastBotFromNode } from '../broadcast-bot/broadcast-bot.renderer';
import { generateBroadcastClientFromNode } from '../broadcast-client/broadcast-client.renderer';
import { generateSticker as generateStickerTemplate } from '../sticker/sticker.renderer';
import { generateVoice as generateVoiceTemplate } from '../voice/voice.renderer';
import { generateCommand as generateCommandTemplate } from '../command/command.renderer';
import { generateStart as generateStartTemplate } from '../start/start.renderer';
import { sortButtonsByLayout } from '../keyboard/keyboard.renderer';

/**
 * Определяет тип медиа по URL и возвращает объект с нужным полем.
 * Если attachedMedia — массив URL-строк, берём первый и определяем тип по расширению.
 * Если уже заданы imageUrl/videoUrl/audioUrl/documentUrl — они имеют приоритет.
 */
export function resolveMediaUrls(data: any): {
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  documentUrl: string;
  attachedMediaUrls: string[];
} {
  const imageUrl = data?.imageUrl || '';
  const videoUrl = data?.videoUrl || '';
  const audioUrl = data?.audioUrl || '';
  const documentUrl = data?.documentUrl || '';
  const rawAttached: unknown[] = Array.isArray(data?.attachedMedia) ? data.attachedMedia : [];

  // Если уже есть явные URL-поля — используем их, attachedMedia как есть
  if (imageUrl || videoUrl || audioUrl || documentUrl) {
    return { imageUrl, videoUrl, audioUrl, documentUrl, attachedMediaUrls: rawAttached as string[] };
  }

  // attachedMedia — массив URL-строк: нормализуем
  const urlStrings = (rawAttached as string[]).filter(u => typeof u === 'string' && u.startsWith('http'));
  if (urlStrings.length === 0) {
    return { imageUrl, videoUrl, audioUrl, documentUrl, attachedMediaUrls: [] };
  }

  // Первый URL определяет основной тип (для caption + keyboard)
  const first = urlStrings[0].toLowerCase();
  const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/.test(first);
  const isAudio = /\.(mp3|ogg|wav|m4a|flac)(\?|$)/.test(first);
  const isDoc   = /\.(pdf|doc|docx|xls|xlsx|zip|rar|txt|csv)(\?|$)/.test(first);
  const isPhoto = !isVideo && !isAudio && !isDoc;

  return {
    imageUrl:    isPhoto ? urlStrings[0] : '',
    videoUrl:    isVideo ? urlStrings[0] : '',
    audioUrl:    isAudio ? urlStrings[0] : '',
    documentUrl: isDoc   ? urlStrings[0] : '',
    attachedMediaUrls: urlStrings,
  };
}

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
  const media = resolveMediaUrls(node.data);
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
    oneTimeKeyboard: node.data?.oneTimeKeyboard ?? false,
    resizeKeyboard: node.data?.resizeKeyboard ?? true,
    buttons: sortButtonsByLayout(
      node.data?.buttons?.map((btn: any) => ({ ...btn, target: btn.target || btn.id || '' })) || [],
      node.data?.keyboardLayout
    ),
    formatMode: (node.data?.formatMode && node.data.formatMode !== 'none') ? node.data.formatMode : (node.data?.markdown ? 'markdown' : 'none'),
    fallbackMessage: node.data?.fallbackMessage || '',
    imageUrl: media.imageUrl,
    documentUrl: media.documentUrl,
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    attachedMedia: media.attachedMediaUrls,
    userDatabaseEnabled,
    enableAutoTransition: node.data?.enableAutoTransition || false,
    autoTransitionTo: node.data?.autoTransitionTo || '',
  });
}

/**
 * Генерирует обработчик команды /start (start)
 */
export function generateStartHandler(
  node: Node,
  userDatabaseEnabled: boolean = false
): string {
  const media = resolveMediaUrls(node.data);
  return generateStartTemplate({
    nodeId: node.id,
    messageText: node.data?.messageText || '',
    isPrivateOnly: node.data?.isPrivateOnly || false,
    adminOnly: node.data?.adminOnly || false,
    requiresAuth: node.data?.requiresAuth || false,
    synonyms: node.data?.synonyms || [],
    allowMultipleSelection: node.data?.allowMultipleSelection || false,
    multiSelectVariable: node.data?.multiSelectVariable || 'selected_options',
    buttons: sortButtonsByLayout(
      node.data?.buttons?.map((btn: any) => ({ ...btn, target: btn.target || btn.id || '' })) || [],
      node.data?.keyboardLayout
    ),
    keyboardType: node.data?.keyboardType || 'none',
    keyboardLayout: node.data?.keyboardLayout,
    oneTimeKeyboard: node.data?.oneTimeKeyboard ?? false,
    resizeKeyboard: node.data?.resizeKeyboard ?? true,
    enableAutoTransition: node.data?.enableAutoTransition || false,
    autoTransitionTo: node.data?.autoTransitionTo || '',
    collectUserInput: node.data?.collectUserInput || false,
    enableTextInput: node.data?.enableTextInput ?? true,
    enablePhotoInput: node.data?.enablePhotoInput || false,
    photoInputVariable: node.data?.photoInputVariable || '',
    enableVideoInput: node.data?.enableVideoInput || false,
    videoInputVariable: node.data?.videoInputVariable || '',
    enableAudioInput: node.data?.enableAudioInput || false,
    audioInputVariable: node.data?.audioInputVariable || '',
    enableDocumentInput: node.data?.enableDocumentInput || false,
    documentInputVariable: node.data?.documentInputVariable || '',
    inputVariable: node.data?.inputVariable || 'input',
    inputTargetNodeId: node.data?.inputTargetNodeId || '',
    minLength: node.data?.minLength ?? 0,
    maxLength: node.data?.maxLength ?? 0,
    appendVariable: node.data?.appendVariable ?? false,
    validationType: (node.data as any)?.validationType || 'none',
    retryMessage: (node.data as any)?.retryMessage || 'Пожалуйста, попробуйте еще раз.',
    successMessage: node.data?.successMessage || '',
    saveToDatabase: node.data?.saveToDatabase ?? true,
    formatMode: (node.data?.formatMode && node.data.formatMode !== 'none') ? node.data.formatMode : (node.data?.markdown ? 'markdown' : 'none'),
    imageUrl: media.imageUrl,
    documentUrl: media.documentUrl,
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    attachedMedia: media.attachedMediaUrls,
    userDatabaseEnabled,
    hasUserIdsVariable: /\{user_ids(?:_count)?\}/.test(node.data?.messageText || ''),
  });
}
