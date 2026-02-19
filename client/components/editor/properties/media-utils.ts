/**
 * @fileoverview Утилиты для работы с медиафайлами в редакторе
 * 
 * Содержит функции для определения типа медиафайла по расширению
 * и формирования обновлений для данных узла.
 * 
 * Используется в панели свойств при прикреплении медиафайлов к узлам.
 * 
 * @module media-utils
 */

import { Node } from '@shared/schema';

/**
 * Результат определения типа медиафайла
 */
interface MediaUpdateResult {
  /** Тип медиа: image, video, audio или document */
  type: 'image' | 'video' | 'audio' | 'document';
  /** Переменная для прикрепленного медиа */
  variableName: string;
}

/**
 * Определяет тип медиафайла по расширению в URL
 * 
 * @param {string} url - URL медиафайла
 * @returns {MediaUpdateResult} Тип медиа и имя переменной
 */
export function getMediaTypeByUrl(url: string): MediaUpdateResult {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];

  if (imageExtensions.includes(extension)) {
    return { type: 'image', variableName: 'imageUrlVar' };
  }
  if (videoExtensions.includes(extension)) {
    return { type: 'video', variableName: 'videoUrlVar' };
  }
  if (audioExtensions.includes(extension)) {
    return { type: 'audio', variableName: 'audioUrlVar' };
  }
  
  return { type: 'document', variableName: 'documentUrlVar' };
}

/**
 * Формирует обновления для данных узла на основе типа медиа
 * 
 * @param {string} url - URL медиафайла
 * @param {string} nodeId - ID узла
 * @param {string | undefined} fileName - Имя файла (для документов)
 * @param {string[] | undefined} currentAttachedMedia - Текущие прикрепленные медиа
 * @returns {Partial<Node['data']>} Обновления для данных узла
 */
export function getMediaUrlUpdates(
  url: string,
  nodeId: string,
  fileName?: string,
  currentAttachedMedia?: string[]
): Partial<Node['data']> {
  const { type, variableName } = getMediaTypeByUrl(url);
  const variable = `${variableName}_${nodeId}`;
  
  const updates: Partial<Node['data']> = {
    imageUrl: undefined,
    videoUrl: undefined,
    audioUrl: undefined,
    documentUrl: undefined,
    documentName: undefined
  };

  if (type === 'image') {
    updates.imageUrl = url;
  } else if (type === 'video') {
    updates.videoUrl = url;
  } else if (type === 'audio') {
    updates.audioUrl = url;
  } else {
    updates.documentUrl = url;
    updates.documentName = fileName || 'document';
  }

  // Добавляем переменную в attachedMedia, если её там ещё нет
  const attachedMedia = currentAttachedMedia || [];
  if (!attachedMedia.includes(variable)) {
    updates.attachedMedia = [...attachedMedia, variable];
  }

  return updates;
}
