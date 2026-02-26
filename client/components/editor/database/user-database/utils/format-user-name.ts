import { UserBotData } from '@shared/schema';

/**
 * @fileoverview Утилита форматирования имени пользователя
 * @description Форматирует имя пользователя для отображения в интерфейсе
 */

/**
 * Форматирует имя пользователя для отображения
 * @param user - Данные пользователя
 * @returns Отформатированное имя (имя + фамилия, или username, или ID)
 */
export function formatUserName(user: UserBotData): string {
  const firstName = user.firstName;
  const lastName = user.lastName;
  const userName = user.userName;
  const userId = user.userId;

  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (userName) return `@${userName}`;
  return `ID: ${userId}`;
}
