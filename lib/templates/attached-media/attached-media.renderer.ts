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

interface MediaEntry {
  url: string;
  fileType: 'photo' | 'video' | 'audio' | 'document';
  isLocal: boolean;
  mediaClass: string;
  isFirst: boolean;
}

function toMediaEntry(url: string, index: number): MediaEntry {
  const fileType = getMediaType(url);
  const mediaClassMap = {
    photo: 'InputMediaPhoto',
    video: 'InputMediaVideo',
    audio: 'InputMediaAudio',
    document: 'InputMediaDocument',
  };
  return {
    url,
    fileType,
    isLocal: url.startsWith('/uploads/'),
    mediaClass: mediaClassMap[fileType],
    isFirst: index === 0,
  };
}

function buildHandlerContext(handlerContext: string) {
  const isMsg = handlerContext === 'message';
  return {
    userIdSrc: isMsg ? 'message.from_user.id' : 'callback_query.from_user.id',
    msgSrc: isMsg ? 'message' : 'callback_query',
  };
}

function buildParseModeStr(formatMode: string): string {
  if (formatMode === 'html') return ', parse_mode="HTML"';
  if (formatMode === 'markdown') return ', parse_mode="Markdown"';
  return '';
}

function safeAutoId(id?: string): string | undefined {
  return id ? id.replace(/[^a-zA-Z0-9_]/g, '_') : undefined;
}

/**
 * Генерирует Python код для отправки прикреплённых медиафайлов
 */
export function generateAttachedMedia(params: AttachedMediaTemplateParams): string {
  const validated = attachedMediaParamsSchema.parse(params);
  const { userIdSrc, msgSrc } = buildHandlerContext(validated.handlerContext);
  const parseModeStr = buildParseModeStr(validated.formatMode);
  const autoTransitionTo = validated.autoTransitionTo;
  const safeAutoTargetId = safeAutoId(autoTransitionTo);

  const base = {
    nodeId: validated.nodeId,
    safeNodeId: validated.nodeId.replace(/-/g, '_'),
    userIdSrc,
    msgSrc,
    parseModeStr,
    autoTransitionTo,
    safeAutoTargetId,
    waitingStateCode: validated.waitingStateCode,
    fallbackUseSafeEdit: validated.fallbackUseSafeEdit,
  };

  // Ветка 1: статическое изображение
  const staticUrl = params.staticImageUrl;
  if (staticUrl && staticUrl.trim() && staticUrl !== 'undefined') {
    return renderPartialTemplate('attached-media/attached-media.py.jinja2', {
      ...base,
      staticImageUrl: staticUrl,
      isStaticLocal: staticUrl.startsWith('/uploads/'),
      isFakeCallbackCheck: validated.isFakeCallbackCheck,
      mediaVariable: undefined,
      isDirectUrl: false,
      isSingle: false,
      hasGroupable: false,
      hasDocuments: false,
      mediaToSend: [],
      groupable: [],
      documents: [],
    });
  }

  // Ветка 2: динамическое медиа из переменной БД
  const mediaVar = params.mediaVariable;
  if (mediaVar && !mediaVar.startsWith('http') && !mediaVar.startsWith('/uploads/')) {
    return renderPartialTemplate('attached-media/attached-media.py.jinja2', {
      ...base,
      staticImageUrl: undefined,
      isStaticLocal: false,
      isFakeCallbackCheck: false,
      mediaVariable: mediaVar,
      mediaType: params.mediaType,
      isDirectUrl: false,
      isSingle: false,
      hasGroupable: false,
      hasDocuments: false,
      mediaToSend: [],
      groupable: [],
      documents: [],
    });
  }

  // Ветка 3: обычные attachedMedia (статические URL)
  if (!validated.attachedMedia || validated.attachedMedia.length === 0) {
    return '';
  }

  const validMedia = validated.attachedMedia.filter(
    url => url && url !== 'undefined' && (url.startsWith('/uploads/') || url.startsWith('http'))
  );
  if (validMedia.length === 0) return '';

  const hasKeyboard = validated.keyboardType === 'inline' || validated.keyboardType === 'reply';
  const mediaToSend = hasKeyboard && validMedia.length > 1 ? [validMedia[0]] : validMedia;
  const groupable = mediaToSend.filter(url => getMediaType(url) !== 'document');
  const documents = mediaToSend.filter(url => getMediaType(url) === 'document');

  return renderPartialTemplate('attached-media/attached-media.py.jinja2', {
    ...base,
    staticImageUrl: undefined,
    isStaticLocal: false,
    isFakeCallbackCheck: false,
    mediaVariable: undefined,
    isDirectUrl: false,
    mediaToSend: mediaToSend.map(toMediaEntry),
    groupable: groupable.map(toMediaEntry),
    documents: documents.map(toMediaEntry),
    isSingle: mediaToSend.length === 1,
    hasGroupable: groupable.length > 0,
    hasDocuments: documents.length > 0,
  });
}
