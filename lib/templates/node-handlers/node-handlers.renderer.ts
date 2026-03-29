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

  if (imageUrl || videoUrl || audioUrl || documentUrl) {
    return { imageUrl, videoUrl, audioUrl, documentUrl, attachedMediaUrls: rawAttached as string[] };
  }

  const urlStrings = (rawAttached as string[]).filter(u => typeof u === 'string' && (u.startsWith('http') || u.startsWith('/uploads/')));
  if (urlStrings.length === 0) {
    return { imageUrl, videoUrl, audioUrl, documentUrl, attachedMediaUrls: [] };
  }

  const first = urlStrings[0].toLowerCase();
  const isPhoto = /\.(jpg|jpeg|png|webp)(\?|#|$)/.test(first);
  const isVideo = /\.(mp4|mov|avi|mkv|webm|3gp|flv)(\?|#|$)/.test(first);
  const isAudio = /\.(mp3|ogg|oga|wav|m4a|flac|aac)(\?|#|$)/.test(first);
  const isDoc = !isPhoto && !isVideo && !isAudio;

  return {
    imageUrl: isPhoto ? urlStrings[0] : '',
    videoUrl: isVideo ? urlStrings[0] : '',
    audioUrl: isAudio ? urlStrings[0] : '',
    documentUrl: isDoc ? urlStrings[0] : '',
    attachedMediaUrls: urlStrings,
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
