/** @fileoverview Параметры открытия исходного сообщения из вкладки файлов. */
import type { UserBotData } from '@/types/bot';
import { analyticsReturnHref } from '@/components/editor/analytics/analytics-dialog-return';

/**
 * Создаёт начальный выбор чата из ссылки без запроса и изменения данных.
 * @returns Пользователь или групповой чат для открытия
 */
export function readFileMessageUser(): UserBotData | null {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('dialogUser');
  const message = Number(params.get('message'));
  /** Переход из рейтинга открывает весь диалог без обязательного сообщения. */
  const fromAnalytics = !!analyticsReturnHref();
  if (!userId || !/^-?\d+$/.test(userId) || (!fromAnalytics && (!Number.isSafeInteger(message) || message <= 0))) return null;
  const chatType = params.get('chatType');
  return { userId, firstName: `Telegram ${userId}`, isGroup: ['group', 'supergroup', 'channel'].includes(chatType ?? ''), chatType } as unknown as UserBotData;
}

/**
 * Возвращает целевое сообщение только для выбранного в ссылке чата.
 * @param userId - Открытый чат
 * @returns ID сообщения или null
 */
export function readFileMessageId(userId: string | number | undefined): number | null {
  const params = new URLSearchParams(window.location.search);
  const message = Number(params.get('message'));
  return String(userId) === params.get('dialogUser') && Number.isSafeInteger(message) && message > 0 ? message : null;
}
