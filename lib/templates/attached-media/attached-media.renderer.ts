/**
 * @fileoverview Рендерер шаблона отправки прикреплённых медиафайлов
 * @module templates/attached-media/attached-media.renderer
 */

import type { AttachedMediaTemplateParams } from './attached-media.params';
import { attachedMediaParamsSchema } from './attached-media.schema';
import { renderPartialTemplate } from '../template-renderer';

/** Определяет тип медиа по расширению URL */
function getMediaType(url: string): 'photo' | 'video' | 'audio' | 'document' {
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'photo';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'document';
}

/** Медиафайл с предвычисленными полями для шаблона */
interface MediaEntry {
  url: string;
  fileType: 'photo' | 'video' | 'audio' | 'document';
  isLocal: boolean;
  mediaClass: string;
  isFirst: boolean;
}

function toMediaEntry(url: string, index: number): MediaEntry {
  const fileType = getMediaType(url);
  const mediaClassMap = { photo: 'InputMediaPhoto', video: 'InputMediaVideo', audio: 'InputMediaAudio', document: 'InputMediaDocument' };
  return {
    url,
    fileType,
    isLocal: url.startsWith('/uploads/'),
    mediaClass: mediaClassMap[fileType],
    isFirst: index === 0,
  };
}

/**
 * Генерирует Python код для отправки прикреплённых медиафайлов
 * @param params - Параметры медиафайлов
 * @returns Сгенерированный Python код
 */
export function generateAttachedMedia(params: AttachedMediaTemplateParams): string {
  if (!params.attachedMedia || params.attachedMedia.length === 0) {
    return '';
  }

  const validated = attachedMediaParamsSchema.parse({
    ...params,
    formatMode: params.formatMode ?? 'none',
    keyboardType: params.keyboardType ?? 'none',
    handlerContext: params.handlerContext ?? 'callback',
  });

  // Фильтруем валидные URL
  const validMedia = validated.attachedMedia.filter(
    url => url && url !== 'undefined' && (url.startsWith('/uploads/') || url.startsWith('http'))
  );

  if (validMedia.length === 0) return '';

  // При наличии клавиатуры — только первый файл
  const hasKeyboard = validated.keyboardType === 'inline' || validated.keyboardType === 'reply';
  const mediaToSend = hasKeyboard && validMedia.length > 1 ? [validMedia[0]] : validMedia;

  // Разделяем на группы: документы отдельно
  const groupable = mediaToSend.filter(url => getMediaType(url) !== 'document');
  const documents = mediaToSend.filter(url => getMediaType(url) === 'document');

  const context = {
    nodeId: validated.nodeId,
    formatMode: validated.formatMode,
    keyboardType: validated.keyboardType,
    handlerContext: validated.handlerContext,
    // Предвычисленные данные для шаблона
    mediaToSend: mediaToSend.map(toMediaEntry),
    groupable: groupable.map(toMediaEntry),
    documents: documents.map(toMediaEntry),
    isSingle: mediaToSend.length === 1,
    hasGroupable: groupable.length > 0,
    hasDocuments: documents.length > 0,
    userIdSrc: validated.handlerContext === 'message' ? 'message.from_user.id' : 'callback_query.from_user.id',
    msgSrc: validated.handlerContext === 'message' ? 'message' : 'callback_query',
    parseModeStr: validated.formatMode === 'html' ? ', parse_mode="HTML"' : validated.formatMode === 'markdown' ? ', parse_mode="Markdown"' : '',
    safeNodeId: validated.nodeId.replace(/-/g, '_'),
  };

  return renderPartialTemplate('attached-media/attached-media.py.jinja2', context);
}
