/** @fileoverview Проверки срока ожидания, кэша и изоляции токенов при получении имени бота. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Изолированный транспорт без обращений к Telegram. */
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://example.invalid' }));

/** Создаёт ответ Telegram с необязательным именем. */
function response(username?: string) {
  return { ok: true, json: async () => ({ ok: true, result: { username } }) };
}

/** Загружает новый экземпляр модуля с пустым кэшем. */
async function resolver() {
  return (await import('../../services/telegram-bot-username')).fetchBotUsernameFromToken;
}

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); mocks.fetch.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

describe('получение имени бота', () => {
  it('объединяет запросы одного токена и кэширует успех на пять минут', async () => {
    mocks.fetch.mockResolvedValue(response('@sample_bot'));
    const resolve = await resolver();
    expect(await Promise.all([resolve(' token '), resolve('token')])).toEqual(['sample_bot', 'sample_bot']);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300_001);
    expect(await resolve('token')).toBe('sample_bot');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it('не использует результат другого токена и пропускает пустой токен', async () => {
    mocks.fetch.mockResolvedValueOnce(response('first')).mockResolvedValueOnce(response('second'));
    const resolve = await resolver();
    expect(await resolve('')).toBeUndefined();
    expect(await resolve('first-token')).toBe('first');
    expect(await resolve('second-token')).toBe('second');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it('повторяет отсутствующее имя после короткого отрицательного кэша', async () => {
    mocks.fetch.mockResolvedValueOnce(response()).mockResolvedValueOnce(response('restored'));
    const resolve = await resolver();
    expect(await resolve('token')).toBeUndefined();
    expect(await resolve('token')).toBeUndefined();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10_001);
    expect(await resolve('token')).toBe('restored');
  });

  it('ограничивает зависший запрос, отменяет транспорт и позволяет восстановление', async () => {
    mocks.fetch.mockImplementationOnce(() => new Promise(() => {}));
    const resolve = await resolver();
    const pending = resolve('token');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBeUndefined();
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    mocks.fetch.mockResolvedValue(response('recovered'));
    await vi.advanceTimersByTimeAsync(10_001);
    expect(await resolve('token')).toBe('recovered');
  });

  it('ограничивает зависшее чтение тела ответа и скрывает ошибку транспорта', async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true, json: () => new Promise(() => {}) });
    const resolve = await resolver();
    const pending = resolve('slow');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBeUndefined();
    const warn = vi.spyOn(console, 'warn');
    mocks.fetch.mockRejectedValueOnce(new Error('secret-token'));
    expect(await resolve('error')).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ограничивает кэш ста записями', async () => {
    mocks.fetch.mockResolvedValue(response('sample'));
    const resolve = await resolver();
    for (let index = 0; index < 101; index++) await resolve(`token-${index}`);
    await resolve('token-0');
    expect(mocks.fetch).toHaveBeenCalledTimes(102);
  });
});

/** Подтверждённый 401 не повторяется по короткому таймеру сетевых ошибок. */
it('сохраняет отказ401 и разрешает новое значение токена', async () => {
  mocks.fetch.mockResolvedValueOnce({ status: 401, ok: false });
  const resolve = await resolver();
  expect(await resolve('revoked-token')).toBeUndefined();
  await vi.advanceTimersByTimeAsync(600_000);
  expect(await resolve('revoked-token')).toBeUndefined();
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  mocks.fetch.mockResolvedValue(response('new_bot'));
  expect(await resolve('replacement-token')).toBe('new_bot');
});
