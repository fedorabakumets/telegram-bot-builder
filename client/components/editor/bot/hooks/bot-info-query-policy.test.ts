/**
 * @fileoverview Проверки отключения запросов профиля и изоляции разных ботов.
 */
import { describe, expect, it } from 'vitest';
import { botInfoQueryPolicy } from './bot-info-query-policy';

/** Минимальный токен для проверки политики без секретных данных. */
const token = { id: 7, isDefault: 1, isActive: 1, authorizationError: null };

describe('политика запросов профиля бота', () => {
  it('не запрашивает профиль отклонённого или вручную отключённого токена', () => {
    expect(botInfoQueryPolicy([{ ...token, authorizationError: 'unauthorized' }], [], true).enabled).toBe(false);
    expect(botInfoQueryPolicy([{ ...token, isActive: 0 }], [], true).enabled).toBe(false);
  });
  it('не подменяет отключённого бота по умолчанию профилем другого бота', () => {
    const result = botInfoQueryPolicy([{ ...token, isActive: 0 }, { ...token, id: 8, isDefault: 0 }], [], true);
    expect(result).toEqual({ tokenId: 7, enabled: false, refetchInterval: false });
  });
  it('возобновляет запрос после замены и активации токена', () => {
    expect(botInfoQueryPolicy([token], [{ tokenId: 7, status: 'running', instance: null }], true))
      .toEqual({ tokenId: 7, enabled: true, refetchInterval: 60000 });
  });
  it('не обновляет офлайн-профиль из-за работающего бота другого проекта', () => {
    expect(botInfoQueryPolicy([token], [{ tokenId: 99, status: 'running', instance: null }], true).refetchInterval).toBe(false);
  });
  it('без токенов или на экране без профилей запросов нет', () => {
    expect(botInfoQueryPolicy([], [], true).enabled).toBe(false);
    expect(botInfoQueryPolicy([token], [], false).enabled).toBe(false);
  });
});
