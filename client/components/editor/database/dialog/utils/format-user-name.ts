/**
 * @fileoverview Утилита форматирования имени пользователя
 * Объединяет имя, фамилию и username
 */

import { UserBotData } from '@shared/schema';

/**
 * Форматирует имя пользователя для отображения
 * @param userData - Данные пользователя
 * @returns Отформатированное имя или ID
 */
export function formatUserName(userData: UserBotData | null): string {
  if (!userData) return '';
  const parts = [];
  if (userData.firstName) parts.push(userData.firstName);
  if (userData.lastName) parts.push(userData.lastName);
  if (userData.userName) parts.push(`@${userData.userName}`);
  return parts.length > 0 ? parts.join(' ') : `ID: ${userData.userId}`;
}
