/**
 * @fileoverview Генерация Python импортов для бота
 * Функции для генерации импортов в зависимости от типов узлов
 */

import { Button } from '../types';
import { hasMediaNodes } from '../../MediaHandler/hasMediaNodes';

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
}

/**
 * Генерирует импорты для команд и стартовых узлов
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateCommandImports = (options: ImportGeneratorOptions): string => {
  const { nodes } = options;
  const hasCommandNodes = nodes.some(
    (node) =>
      node.type === 'command' ||
      (node.data.buttons &&
        node.data.buttons.some((btn: Button) => btn.action === 'command'))
  );
  const hasStartNodes = nodes.some((node) => node.type === 'start');

  if (!hasCommandNodes && !hasStartNodes) {
    return '';
  }

  let imports = '';
  if (hasStartNodes) {
    imports += 'from aiogram.filters import CommandStart\n';
  }
  if (hasCommandNodes) {
    imports += 'from aiogram.filters import Command\n';
  }
  return imports;
};

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

/**
 * Генерирует импорты для режима парсинга (HTML/Markdown)
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateParseModeImports = (options: ImportGeneratorOptions): string => {
  const { nodes } = options;

  const hasNodesRequiringParseMode = nodes.some((node) => {
    const data = node.data || {};
    
    // Узлы с явным formatMode
    if (
      data.formatMode &&
      (data.formatMode.toLowerCase() === 'html' ||
        data.formatMode.toLowerCase() === 'markdown')
    ) {
      return true;
    }
    
    // Узлы с markdown флагом
    if (data.markdown === true) {
      return true;
    }
    
    // Узлы с кнопками и форматированием
    if (
      data.buttons &&
      data.buttons.length > 0 &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    // Узлы с медиа и caption
    if (
      (data.imageUrl ||
        data.videoUrl ||
        data.audioUrl ||
        data.documentUrl) &&
      data.mediaCaption
    ) {
      return true;
    }
    
    // Узлы с сбором ввода и форматированием
    if (
      data.collectUserInput === true &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    // Узлы с условными сообщениями и форматированием
    if (
      data.enableConditionalMessages === true &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    return false;
  });

  if (!hasNodesRequiringParseMode) {
    return '';
  }

  return 'from aiogram.enums import ParseMode\n';
};

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

/**
 * Генерирует все необходимые Python импорты для бота
 * @param options - Параметры генерации
 * @returns {string} Полный код импортов
 */
export const generatePythonImports = (
  options: ImportGeneratorOptions
): string => {
  let imports = '';

  imports += generateCommandImports(options);
  imports += generateUrlImageImports(options);
  imports += generateDatetimeImports(options);
  imports += generateParseModeImports(options);
  imports += generateTelegramBadRequestImports(options);

  // Модуль re требуется для функции replace_variables_in_text
  imports += 'import re\n';

  return imports;
};
