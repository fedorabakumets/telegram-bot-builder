/**
 * @fileoverview Генерация импортов для исключений Telegram
 * Функции для генерации импортов TelegramBadRequest
 */

import { hasMediaNodes } from '../MediaHandler/hasMediaNodes';

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
}

/**
 * Генерирует импорты для обработки исключений Telegram
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateTelegramBadRequestImports = (
  options: ImportGeneratorOptions
): string => {
  const { nodes } = options;

  const hasStickerNodes = nodes.some((node) => node.type === 'sticker');
  const hasVoiceNodes = nodes.some((node) => node.type === 'voice');
  const hasLocationNodes = nodes.some((node) => node.type === 'location');
  const hasContactNodes = nodes.some((node) => node.type === 'contact');
  const hasMediaNodesResult = hasMediaNodes(nodes);

  const hasNodesRequiringTelegramBadRequest = nodes.some(
    (node) =>
      node.type === 'delete_message' ||
      node.type === 'pin_message' ||
      node.type === 'unpin_message' ||
      node.type === 'ban_user' ||
      node.type === 'unban_user' ||
      node.type === 'mute_user' ||
      node.type === 'unmute_user' ||
      node.type === 'kick_user' ||
      node.type === 'promote_user' ||
      node.type === 'demote_user' ||
      node.type === 'admin_rights' ||
      hasStickerNodes ||
      hasVoiceNodes ||
      hasLocationNodes ||
      hasContactNodes ||
      hasMediaNodesResult
  );

  if (!hasNodesRequiringTelegramBadRequest) {
    return '';
  }

  return 'from aiogram.exceptions import TelegramBadRequest\n';
};
