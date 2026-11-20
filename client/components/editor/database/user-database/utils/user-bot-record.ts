/** @fileoverview Подготовка отдельной строки бота из сводной записи пользователя. */
import type { UserBotData } from '@shared/schema';
import type { UserBotMembership } from '@shared/user-bot-membership';
/**
 * Сохраняет личность пользователя и подставляет только данные выбранного бота.
 * @param user - Сводная запись пользователя.
 * @param bot - Связь пользователя с конкретным ботом.
 * @returns Самостоятельная запись для строки, переменных и перехода к диалогу.
 */
export function userBotRecord(user: UserBotData, bot: UserBotMembership): UserBotData {
  return { ...user, ...bot, id: `${user.userId}:${bot.tokenId}`, botMemberships: [bot] };
}
