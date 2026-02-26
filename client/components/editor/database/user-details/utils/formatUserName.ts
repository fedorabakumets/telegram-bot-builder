/**
 * @fileoverview Утилита форматирования имени пользователя
 * @description Форматирует имя пользователя для отображения в интерфейсе
 */

import { UserBotData } from '@shared/schema';

/**
 * Форматирует имя пользователя для отображения
 * @param {UserBotData | null} userData - Данные пользователя
 * @returns {string} Отформатированное имя или ID
 */
export function formatUserName(userData: UserBotData | null): string {
  if (!userData) return '';
  const parts: string[] = [];
  if (userData.firstName) parts.push(userData.firstName);
  if (userData.lastName) parts.push(userData.lastName);
  if (userData.userName) parts.push(`@${userData.userName}`);
  return parts.length > 0 ? parts.join(' ') : `ID: ${userData.userId}`;
}
