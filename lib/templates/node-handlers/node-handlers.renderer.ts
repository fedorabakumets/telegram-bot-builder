/**
 * @fileoverview Генерация обработчиков для типов узлов через шаблоны
 * @module generate/generate-new-node-handlers
 */

import { Node } from '@shared/schema';
import { generateBroadcastBotFromNode } from '../broadcast-bot/broadcast-bot.renderer';
import { generateBroadcastClientFromNode } from '../broadcast-client/broadcast-client.renderer';
import { generateSticker as generateStickerTemplate } from '../sticker/sticker.renderer';
import { generateVoice as generateVoiceTemplate } from '../voice/voice.renderer';

/**
 * Определяет тип медиа по URL и возвращает объект с нужным полем.
 */

/**
 * Проверяет является ли URL локальным путём к загруженному файлу.
 * Только пути начинающиеся с /uploads/ считаются локальными.
 * Внешние URL (http/https) содержащие /uploads/ в пути — не локальные.
 * @param url - URL для проверки
 * @returns true если это локальный /uploads/ путь
 */
export function isLocalUploadPath(url: string): boolean {
  return typeof url === 'string' && url.startsWith('/uploads/');
}
export function resolveMediaUrls(data: any): {
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  documentUrl: string;
  attachedMediaUrls: string[];
  /** Флаг: imageUrl является локальным путём /uploads/ */
  isLocalImageUrl: boolean;
  /** Флаг: videoUrl является локальным путём /uploads/ */
  isLocalVideoUrl: boolean;
  /** Флаг: audioUrl является локальным путём /uploads/ */
  isLocalAudioUrl: boolean;
  /** Флаг: documentUrl является локальным путём /uploads/ */
  isLocalDocumentUrl: boolean;
} {
  const imageUrl = data?.imageUrl || '';
  const videoUrl = data?.videoUrl || '';
  const audioUrl = data?.audioUrl || '';
  const documentUrl = data?.documentUrl || '';
  const rawAttached: unknown[] = Array.isArray(data?.attachedMedia) ? data.attachedMedia : [];

  if (imageUrl || videoUrl || audioUrl || documentUrl) {
    return {
      imageUrl,
      videoUrl,
      audioUrl,
      documentUrl,
      attachedMediaUrls: rawAttached as string[],
      isLocalImageUrl: isLocalUploadPath(imageUrl),
      isLocalVideoUrl: isLocalUploadPath(videoUrl),
      isLocalAudioUrl: isLocalUploadPath(audioUrl),
      isLocalDocumentUrl: isLocalUploadPath(documentUrl),
    };
  }

  const urlStrings = (rawAttached as string[]).filter(u => typeof u === 'string' && (u.startsWith('http') || u.startsWith('/uploads/')));
  if (urlStrings.length === 0) {
    return {
      imageUrl,
      videoUrl,
      audioUrl,
      documentUrl,
      attachedMediaUrls: [],
      isLocalImageUrl: false,
      isLocalVideoUrl: false,
      isLocalAudioUrl: false,
      isLocalDocumentUrl: false,
    };
  }

  const first = urlStrings[0].toLowerCase();
  const isPhoto = /\.(jpg|jpeg|png|webp)(\?|#|$)/.test(first);
  const isVideo = /\.(mp4|mov|avi|mkv|webm|3gp|flv)(\?|#|$)/.test(first);
  const isAudio = /\.(mp3|ogg|oga|wav|m4a|flac|aac)(\?|#|$)/.test(first);
  const isDoc = !isPhoto && !isVideo && !isAudio;

  const resolvedImageUrl = isPhoto ? urlStrings[0] : '';
  const resolvedVideoUrl = isVideo ? urlStrings[0] : '';
  const resolvedAudioUrl = isAudio ? urlStrings[0] : '';
  const resolvedDocumentUrl = isDoc ? urlStrings[0] : '';

  return {
    imageUrl: resolvedImageUrl,
    videoUrl: resolvedVideoUrl,
    audioUrl: resolvedAudioUrl,
    documentUrl: resolvedDocumentUrl,
    attachedMediaUrls: urlStrings,
    isLocalImageUrl: isLocalUploadPath(resolvedImageUrl),
    isLocalVideoUrl: isLocalUploadPath(resolvedVideoUrl),
    isLocalAudioUrl: isLocalUploadPath(resolvedAudioUrl),
    isLocalDocumentUrl: isLocalUploadPath(resolvedDocumentUrl),
  };
}

/**
 * Генерирует обработчик рассылки (broadcast)
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
