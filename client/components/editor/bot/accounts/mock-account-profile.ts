/** @fileoverview Вымышленные реквизиты подключённого Telegram-аккаунта. */

/** Параметры демонстрационного приложения Telegram. */
export const demoTelegramApp = { id: '12345678', hash: '0123456789abcdef0123456789abcdef' };

/** Профиль, который прототип показывает после подключения. */
export interface MockAccountProfile {
  /** Номер в международном формате. */
  phone: string;
  /** Имя из демонстрационного профиля. */
  firstName: string;
  /** Фамилия из демонстрационного профиля. */
  lastName: string;
  /** Вымышленное имя пользователя. */
  username: string;
}

/**
 * Формирует профиль без обращения к Telegram.
 * @param accountNumber - Порядковый номер карточки.
 * @param phone - Номер, введённый в демо-форме.
 * @returns Демонстрационные данные аккаунта.
 */
export function createMockAccountProfile(accountNumber: number, phone?: string): MockAccountProfile {
  return {
    phone: phone ?? `+120255501${String(accountNumber % 100).padStart(2, '0')}`,
    firstName: 'Алексей', lastName: 'Морозов', username: `@demo_account_${accountNumber}`,
  };
}
