/**
 * @fileoverview Утилиты для работы с сообщениями
 * Проверка и извлечение данных кнопок
 */

import { BotMessageWithMedia } from '../types';

/**
 * Проверка наличия кнопок в сообщении
 */
export function hasButtons(message: BotMessageWithMedia): boolean {
  return !!(
    message.messageData &&
    typeof message.messageData === 'object' &&
    'buttons' in message.messageData &&
    Array.isArray((message.messageData as Record<string, any>).buttons) &&
    ((message.messageData as Record<string, any>).buttons as Array<any>).length > 0
  );
}

/**
 * Получение кнопок из сообщения
 */
export function getButtons(message: BotMessageWithMedia): Array<any> {
  return Array.isArray((message.messageData as any)?.buttons)
    ? (message.messageData as any).buttons
    : [];
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
