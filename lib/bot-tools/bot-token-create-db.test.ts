/**
 * @fileoverview Проверки формата токена и получения профиля перед добавлением через MCP
 * @module lib/bot-tools/bot-token-create-db.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { addBotTokenInDb, isTelegramBotTokenFormat } from './bot-token-create-db.ts';
import { apiFetch } from './api-fetch.ts';

vi.mock('./api-fetch.ts', () => ({ apiFetch: vi.fn() }));
afterEach(() => vi.resetAllMocks());

/** Тестовый секрет используется только в замоканных запросах. */
const token = `123456789:${'a'.repeat(35)}`;
/** Профиль в формате ответа ручного добавления. */
const profile = { botFirstName: 'Обменники', botUsername: 'example_bot', botShortDescription: 'Курсы', botPhotoUrl: '/photo', botCanJoinGroups: 1 };

describe('addBotTokenInDb', () => {
  it('получает профиль перед созданием и передаёт все его поля', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json(profile));
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json({ id: 301, token, botUsername: 'example_bot' }, { status: 201 }));
    const result = await addBotTokenInDb(289, token, { apiBaseUrl: 'http://test', isDefault: true });
    expect(vi.mocked(apiFetch).mock.calls[0][0]).toBe('/api/projects/289/tokens/parse');
    expect(JSON.parse(String(vi.mocked(apiFetch).mock.calls[0][1]?.body))).toEqual({ token });
    expect(vi.mocked(apiFetch).mock.calls[1][0]).toBe('/api/projects/289/tokens');
    expect(JSON.parse(String(vi.mocked(apiFetch).mock.calls[1][1]?.body))).toEqual({ ...profile, token, name: 'Обменники (@example_bot)', description: 'Курсы', isActive: 1, isDefault: 1 });
    expect(result).toMatchObject({ ok: true, created: true, id: 301 });
    expect(result).not.toHaveProperty('token');
  });

  it('сохраняет заданное имя и возвращает существующую запись без секрета', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json(profile));
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json({ id: 301, token }));
    expect(await addBotTokenInDb(289, token, { name: 'Мой бот' })).toMatchObject({ created: false, name: 'Мой бот' });
    expect(JSON.parse(String(vi.mocked(apiFetch).mock.calls[1][1]?.body)).name).toBe('Мой бот');
  });

  it('не создаёт запись при ошибке получения профиля', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json({}, { status: 504 }));
    expect(await addBotTokenInDb(289, token)).toHaveProperty('error');
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('не создаёт запись при неполном ответе профиля', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(Response.json({}));
    expect(await addBotTokenInDb(289, token)).toHaveProperty('error');
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});

describe('isTelegramBotTokenFormat', () => {
  it('принимает типичный токен BotFather', () => {
    expect(
      isTelegramBotTokenFormat('7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX'),
    ).toBe(true);
  });

  it('отклоняет пустую строку и мусор', () => {
    expect(isTelegramBotTokenFormat('')).toBe(false);
    expect(isTelegramBotTokenFormat('not-a-token')).toBe(false);
    expect(isTelegramBotTokenFormat('123:short')).toBe(false);
  });
});
