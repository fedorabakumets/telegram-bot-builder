/**
 * @fileoverview Утилиты для работы с сообщениями
 * Проверка и извлечение данных кнопок
 */

import { BotMessageWithMedia } from '../types';

/**
 * Проверка наличия кнопок в сообщении
 */
export function hasButtons(message: BotMessageWithMedia): boolean {
  if (
    message.messageData &&
    typeof message.messageData === 'object' &&
    'buttons' in message.messageData
  ) {
    const buttons = (message.messageData as Record<string, any>).buttons;
    return Array.isArray(buttons) && buttons.length > 0;
  }
  return false;
}

/**
 * Получение кнопок из сообщения
 */
export function getButtons(message: BotMessageWithMedia): Array<any> {
  if (
    message.messageData &&
    typeof message.messageData === 'object' &&
    'buttons' in message.messageData
  ) {
    const buttons = (message.messageData as Record<string, any>).buttons;
    return Array.isArray(buttons) ? buttons : [];
  }
  return [];
}

/**
 * Проверка нажатия кнопки пользователем
 */
export function hasButtonClicked(message: BotMessageWithMedia): boolean {
  return !!(
    message.messageData &&
    typeof message.messageData === 'object' &&
    'button_clicked' in message.messageData &&
    message.messageData.button_clicked
  );
}

/**
 * Получение текста нажатой кнопки
 */
export function getButtonText(message: BotMessageWithMedia): string | null {
  if (!message.messageData || typeof message.messageData !== 'object') return null;
  const data = message.messageData as Record<string, any>;
  return data.button_text ? `Нажата: ${data.button_text}` : null;
}
