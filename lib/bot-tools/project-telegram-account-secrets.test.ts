/** @fileoverview Проверки изоляции зашифрованных параметров Telegram-аккаунтов. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { maskProjectTelegramPhone, openProjectTelegramSecret, sealProjectTelegramSecret } from '../../server/database/project-telegram-account-secrets';

afterEach(() => vi.unstubAllEnvs());

describe('Секреты Telegram-аккаунта', () => {
  it('шифрует значение и разрешает чтение только в исходном контексте', () => {
    vi.stubEnv('STORAGE_ENCRYPTION_KEY', 'тестовый-ключ-для-хранилища');
    const payload = { apiHash: 'пример значения для теста' };
    const encrypted = sealProjectTelegramSecret(1, 20, 'session', payload);
    expect(encrypted).not.toContain(payload.apiHash);
    expect(sealProjectTelegramSecret(1, 20, 'session', payload)).not.toBe(encrypted);
    expect(openProjectTelegramSecret(1, 20, 'session', encrypted)).toEqual(payload);
    expect(() => openProjectTelegramSecret(2, 20, 'session', encrypted)).toThrow();
    expect(() => openProjectTelegramSecret(1, 21, 'session', encrypted)).toThrow();
    expect(() => openProjectTelegramSecret(1, 20, 'proxy', encrypted)).toThrow();
  });

  it('отказывается записывать открытые данные без ключа шифрования', () => {
    vi.stubEnv('STORAGE_ENCRYPTION_KEY', '');
    expect(() => sealProjectTelegramSecret(1, 20, 'proxy', { password: 'пример' })).toThrow('STORAGE_ENCRYPTION_KEY');
  });

  it('оставляет в представлении телефона только последние две цифры', () => {
    expect(maskProjectTelegramPhone('+0 123 456 78 90')).toBe('•••• 90');
    expect(maskProjectTelegramPhone('•••• 90')).toBe('•••• 90');
    expect(maskProjectTelegramPhone('')).toBeNull();
  });
});
