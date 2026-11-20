/** @fileoverview Объединение реквизитов общего профиля с полной записью пользователя. */
import type { UserBotData } from '@shared/schema';
import type { UserBotData as ProfileUser } from '@/types/bot';

/**
 * Возвращает сохранённую дату в формате ответа API.
 * @param value - Дата общего профиля
 * @param fallback - Ранее сохранённая дата
 * @returns Строка даты либо отсутствие значения
 */
function storedDate(value: string | Date | null | undefined, fallback: string | null): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
  return value === undefined ? fallback : value;
}

/**
 * Сохраняет ответы и метаданные записи при обновлении общего профиля или выборе бота.
 * @param initial - Полная запись из вкладки пользователей
 * @param profile - Реквизиты общего профиля
 * @param tokenId - Бот текущего профиля
 * @returns Совместимая запись для статистики, ответов и перехода к переписке
 */
export function mergeProfileUser(initial: UserBotData, profile: ProfileUser, tokenId?: number | null): UserBotData {
  return {
    ...initial, ...profile, userId: String(profile.userId), tokenId: tokenId ?? profile.tokenId,
    isActive: Boolean(profile.isActive ?? initial.isActive),
    isPremium: Boolean(profile.isPremium ?? initial.isPremium),
    isBot: Boolean(profile.isBot ?? initial.isBot),
    registeredAt: storedDate(profile.registeredAt, initial.registeredAt),
    createdAt: storedDate(profile.createdAt, initial.createdAt),
    lastInteraction: storedDate(profile.lastInteraction, initial.lastInteraction),
    lastMessageAt: storedDate(profile.lastMessageAt, initial.lastMessageAt),
  };
}
