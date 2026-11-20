/** @fileoverview Проверки заморозки и сохранения прежних команд без обращений к чатам. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../../utils/telegram-proxy', () => ({ fetchWithProxy: request }));
vi.mock('../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://api.telegram.org' }));
import { probeTelegramBot } from './probe-telegram-bot';
/** Сброс не возвращает мок как функцию очистки теста. */
beforeEach(() => { request.mockReset(); });
/** Успешная идентификация не доказывает отсутствие заморозки. */
const identity = { ok: true, result: { id: 123, is_bot: true } };
describe('Проверка ограничений через команды', () => {
  it('выявляет заморозку при чтении после успешного getMe', async () => {
    request.mockResolvedValueOnce(Response.json(identity)).mockResolvedValueOnce(Response.json({
      ok: false, error_code: 400, description: 'Bad Request: FROZEN_METHOD_INVALID',
    }, { status: 400 }));
    expect(await probeTelegramBot('123:secret')).toBe('telegram_frozen');
    expect(request.mock.calls[1][0]).toContain('/getMyCommands');
    expect(request).toHaveBeenCalledTimes(2);
  });
  it.each([{ commands: [] }, { commands: [{ command: 'start', description: 'Начать' }] }])('сохраняет прежний список: %j', async ({ commands }) => {
    request.mockResolvedValueOnce(Response.json(identity))
      .mockResolvedValueOnce(Response.json({ ok: true, result: commands }))
      .mockResolvedValueOnce(Response.json({ ok: true, result: true }));
    expect(await probeTelegramBot('123:secret')).toBe('available');
    expect(request.mock.calls[2][0]).toContain('/setMyCommands');
    expect(JSON.parse(request.mock.calls[2][1].body)).toEqual({ commands });
    expect(request.mock.calls.some(call => call[0].includes('sendChatAction'))).toBe(false);
  });
  it('выявляет заморозку при сохранении', async () => {
    request.mockResolvedValueOnce(Response.json(identity)).mockResolvedValueOnce(Response.json({ ok: true, result: [] }))
      .mockResolvedValueOnce(Response.json({ ok: false, error_code: 400, description: 'FROZEN_METHOD_INVALID' }, { status: 400 }));
    expect(await probeTelegramBot('123:secret')).toBe('telegram_frozen');
  });
  it('не записывает неверный список и различает лимит и отказ токена', async () => {
    request.mockResolvedValueOnce(Response.json(identity)).mockResolvedValueOnce(Response.json({ ok: true, result: {} }));
    expect(await probeTelegramBot('123:secret')).toBe('error');
    expect(request).toHaveBeenCalledTimes(2);
    request.mockResolvedValue(Response.json({ ok: false, error_code: 429 }, { status: 429 }));
    expect(await probeTelegramBot('123:secret')).toBe('rate_limited');
    request.mockResolvedValue(Response.json({ ok: false, error_code: 401 }, { status: 401 }));
    expect(await probeTelegramBot('123:secret')).toBe('unauthorized');
  });
});

/** Временный сбой не обрывает проверку; успешная повторная попытка продолжает проверку заморозки. */
it('повторяет тайм-аут и затем обнаруживает заморозку', async () => {
  request.mockRejectedValueOnce(new DOMException('тайм-аут', 'TimeoutError'))
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(Response.json({ ok: false, error_code: 400, description: 'FROZEN_METHOD_INVALID' }, { status: 400 }));
  expect(await probeTelegramBot('123:secret')).toBe('telegram_frozen');
  expect(request).toHaveBeenCalledTimes(3);
});
/** Исчерпание ограниченного числа попыток не выдаётся за заморозку или неверный токен. */
it('завершает два тайм-аута неопределённостью без раскрытия секрета', async () => {
  request.mockRejectedValue(Object.assign(new Error('секретный адрес'), { name: 'TimeoutError' }));
  const report = vi.fn();
  expect(await probeTelegramBot('123:secret', report)).toBe('error');
  expect(request).toHaveBeenCalledTimes(2);
  expect(report).toHaveBeenLastCalledWith({ method: 'getMe', reason: 'timeout' });
  expect(JSON.stringify(report.mock.calls)).not.toContain('secret');
});
/** Ошибка чтения тела также охвачена повторной попыткой. */
it('повторяет оборвавшееся тело ответа', async () => {
  request.mockResolvedValueOnce({ json: () => Promise.reject(new Error('обрыв')) })
    .mockResolvedValueOnce(Response.json({ ok: false, error_code: 401 }, { status: 401 }));
  expect(await probeTelegramBot('123:secret')).toBe('unauthorized');
  expect(request).toHaveBeenCalledTimes(2);
});
