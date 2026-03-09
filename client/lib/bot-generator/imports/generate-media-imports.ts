/**
 * @fileoverview Генерация импортов для медиа и дат
 * Функции для генерации импортов URLInputFile, datetime, timezone
 */

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
}

/**
 * Генерирует импорты для работы с URL изображениями
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateUrlImageImports = (options: ImportGeneratorOptions): string => {
  const { nodes } = options;
  const hasUrlImageNodes = nodes.some(
    (node) => node.data?.imageUrl && node.data.imageUrl.startsWith('http')
  );

  if (!hasUrlImageNodes) {
    return '';
  }

  return 'from aiogram.types import URLInputFile\n';
};

/**
 * Генерирует импорты для работы с датой и временем
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateDatetimeImports = (options: ImportGeneratorOptions): string => {
  const { nodes, userDatabaseEnabled } = options;

  const hasNodesRequiringDatetime = nodes.some(
    (node) =>
      node.type === 'command' ||
      node.type === 'mute_user' ||
      node.type === 'ban_user' ||
      node.type === 'message' ||
      node.type === 'sticker' ||
      node.type === 'voice' ||
      node.type === 'animation' ||
      node.type === 'photo' ||
      node.type === 'video' ||
      node.type === 'document' ||
      node.type === 'audio' ||
      node.type === 'location' ||
      node.type === 'contact' ||
      node.type === 'group_event'
  );

  const hasNodesRequiringTimezone = nodes.some(
    (node) =>
      node.type === 'photo' ||
      node.type === 'group_event' ||
      (node.data && node.data.enablePhotoInput)
  );

  if (!hasNodesRequiringDatetime && !userDatabaseEnabled) {
    return '';
  }

  if (hasNodesRequiringTimezone) {
    return 'from datetime import datetime, timezone\n';
  }
  return 'from datetime import datetime\n';
};
