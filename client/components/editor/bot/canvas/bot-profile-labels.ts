/**
 * @fileoverview Единые подписи бота с поддержкой старого формата имени с username.
 */
import type { BotToken } from '@shared/schema';

/**
 * Отделяет username из старого имени, если профиль Telegram ещё не заполнен.
 * @param token - Поля профиля бота
 * @returns Имя для заголовка и username без символа @
 */
export function getBotProfileLabels(token: Pick<BotToken, 'id' | 'name' | 'botFirstName' | 'botUsername'>) {
  const legacy = token.name?.match(/^(.*?)\s+\(@([a-zA-Z0-9_]+)\)$/);
  return {
    /** Название бота без добавленного username */
    title: token.botFirstName || legacy?.[1] || token.name || `Бот ${token.id}`,
    /** Username из профиля или старого формата имени */
    username: token.botUsername || legacy?.[2] || null,
  };
}
