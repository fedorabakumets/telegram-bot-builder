/**
 * @fileoverview Читаемые подписи ботов проекта для интерфейса рассылок
 * @module client/components/editor/broadcast/utils/format-bot-label
 */

import type { BotToken } from '@shared/schema';

/**
 * Формирует читаемую подпись бота для интерфейса
 * @param token - Токен бота или undefined
 * @returns Строка для UI
 */
export function formatBotLabel(token: BotToken | undefined): string {
  if (!token) return 'бот по умолчанию';
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botUsername) return `@${token.botUsername}`;
  if (token.botFirstName) return token.botFirstName;
  return token.name || `Бот #${token.id}`;
}

/**
 * Короткая подпись бота — для чипов и компактных списков
 * @param token - Токен бота или undefined
 * @param tokenId - Идентификатор бота (используется, если токен не найден)
 * @returns Короткая строка для UI
 */
export function formatBotShortLabel(token: BotToken | undefined, tokenId?: number): string {
  if (!token) return `Бот #${tokenId ?? '—'}`;
  if (token.botUsername) return `@${token.botUsername}`;
  return token.botFirstName || token.name || `Бот #${token.id}`;
}

/**
 * Склоняет слово «бот» по числу выбранных ботов
 * @param count - Количество ботов
 * @returns Слово в нужной форме
 */
export function pluralizeBots(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'бот';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'бота';
  return 'ботов';
}
