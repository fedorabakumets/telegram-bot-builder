/**
 * @fileoverview Настройка переменных медиа
 *
 * Модуль генерирует Python-код для инициализации переменных медиафайлов
 * (фото, видео, аудио, документы) из данных узла.
 *
 * @module bot-generator/transitions/media-variables-setup
 */

/**
 * Параметры для настройки медиа-переменных
 */
export interface MediaVariablesParams {
  /** ID узла */
  nodeId: string;
  /** URL изображения */
  imageUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** Прикреплённые медиа */
  attachedMedia?: any[];
  /** Включена ли БД пользователей */
  userDatabaseEnabled?: boolean;
}

/**
 * Генерирует код настройки переменных медиа
 *
 * @param params - Параметры медиа
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaVariablesSetup(
  params: MediaVariablesParams,
  indent: string = '    '
): string {
  const { imageUrl, videoUrl, audioUrl, documentUrl, attachedMedia } = params;

  let code = '';
  let hasMedia = false;

  // Проверяем наличие медиа
  if (imageUrl) hasMedia = true;
  if (videoUrl) hasMedia = true;
  if (audioUrl) hasMedia = true;
  if (documentUrl) hasMedia = true;
  if (attachedMedia && attachedMedia.length > 0) hasMedia = true;

  if (!hasMedia) {
    return '';
  }

  code += `${indent}# Настройка переменных медиа\n`;

  // Инициализация переменных медиа
  if (imageUrl) {
    code += `${indent}photo_url = "${imageUrl}"\n`;
  }
  if (videoUrl) {
    code += `${indent}video_url = "${videoUrl}"\n`;
  }
  if (audioUrl) {
    code += `${indent}audio_url = "${audioUrl}"\n`;
  }
  if (documentUrl) {
    code += `${indent}document_url = "${documentUrl}"\n`;
  }

  return code;
}

/**
 * Проверяет, есть ли узел медиафайлы
 *
 * @param nodeData - Данные узла
 * @returns true если есть медиафайлы
 */
export function hasMediaFiles(nodeData: any): boolean {
  if (!nodeData) return false;
  return !!(nodeData.imageUrl || nodeData.videoUrl ||
    nodeData.audioUrl || nodeData.documentUrl ||
    (nodeData.attachedMedia && nodeData.attachedMedia.length > 0));
}
