/** @fileoverview Проверки неподтверждённого импортированного контакта и приоритетов Telegram. */
import { describe, expect, it } from 'vitest';
import type { UserBotData } from '@shared/schema';
import { isImportedContact, userStatus } from './user-summary';

/** Создаёт минимальный импортированный контакт без подтверждённой переписки. */
function importedUser(overrides: Partial<UserBotData> = {}): UserBotData {
  return { userId: '123', importedAt: '2026-11-17T00:00:00Z', hasPrivateMessages: false,
    isActive: false, isBlocked: false, isDeleted: false, ...overrides } as UserBotData;
}

describe('Статус импортированного контакта', () => {
  it('не называет импорт без переписки активным или неактивным', () => {
    expect(isImportedContact(importedUser())).toBe(true);
    expect(userStatus(importedUser())).toBe('Не проверен');
  });
  it('сохраняет приоритет удаления и подтверждённой недоступности бота', () => {
    const unavailable = [{ tokenId: 9, botAvailability: 'Бот заморожен Telegram' }] as UserBotData['botMemberships'];
    expect(userStatus(importedUser({ botMemberships: unavailable }))).toBe('Нет доступных ботов в Telegram');
    expect(userStatus(importedUser({ isDeleted: true, botMemberships: unavailable }))).toBe('Аккаунт удалён');
  });
  it('убирает неподтверждённость после реальной переписки, в том числе в другом боте', () => {
    const confirmed = importedUser({ hasPrivateMessages: true, lastMessageAt: null, isActive: true });
    expect(isImportedContact(confirmed)).toBe(false);
    expect(userStatus(confirmed)).toBe('Активен');
  });
});
