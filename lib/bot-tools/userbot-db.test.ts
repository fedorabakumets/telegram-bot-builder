/**
 * @fileoverview Проверка HTTP-запросов и безопасных ответов юзербота.
 * @module lib/bot-tools/userbot-db.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setUserbotSettingsInDb } from './userbot-settings-db.ts';
import { sendUserbotCodeInDb, signInUserbotInDb, signInUserbot2faInDb } from './userbot-auth-db.ts';
import { runWithMcpToken } from './mcp-request-context.ts';

/** Подмена сетевых запросов */
const fetchMock = vi.fn();

/**
 * Подготавливает JSON-ответ API.
 * @param data - Поля ответа
 * @param status - Статус HTTP
 * @returns Ничего
 */
function reply(data: unknown, status = 200): void {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { status }));
}

/**
 * Возвращает последнее тело запроса.
 * @returns Декодированное тело
 */
function requestBody() {
  return JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('API_BASE_URL', 'http://api.test');
  vi.stubEnv('MCP_AGENT_TOKEN', 'mcp_stdio_test');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('запросы юзербота', () => {
  it('сохраняет только заданные поля и отправляет Bearer stdio', async () => {
    reply({ success: true, userbotEnabled: 0 });
    expect(await setUserbotSettingsInDb(1, 2, { enabled: 0 })).toMatchObject({ ok: true, userbotEnabled: 0 });
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/projects/1/tokens/2/userbot');
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('PUT');
    expect(init.headers.get('Authorization')).toBe('Bearer mcp_stdio_test');
    expect(init.headers.get('Content-Type')).toBe('application/json');
    expect(requestBody()).toEqual({ userbotEnabled: 0 });
  });
  it('передаёт null, маску и пустую строку без изменения правил API', async () => {
    reply({ success: true, userbotEnabled: 1 });
    await setUserbotSettingsInDb(1, 2, { enabled: 1, api_id: null, api_hash: '••••••••', session_string: '' });
    expect(requestBody()).toEqual({ userbotEnabled: 1, userbotApiId: null, userbotApiHash: '••••••••', userbotSessionString: '' });
    reply({ success: true, userbotEnabled: 1 });
    await setUserbotSettingsInDb(1, 2, { enabled: 1, api_id: '123', api_hash: 'hash', session_string: 'session' });
    expect(requestBody()).toEqual({ userbotEnabled: 1, userbotApiId: '123', userbotApiHash: 'hash', userbotSessionString: 'session' });
  });
  it('отправляет код без hash и использует Bearer текущего HTTP-запроса', async () => {
    reply({ ok: true, phone_code_hash: 'secret' });
    await runWithMcpToken('mcp_http_test', () => sendUserbotCodeInDb(1, 2, { api_id: '123', phone: '+7900' }));
    expect(fetchMock.mock.calls[0][0]).toContain('/userbot/send-code');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer mcp_http_test');
    expect(requestBody()).toEqual({ apiId: '123', phone: '+7900' });
    reply({ ok: true });
    await sendUserbotCodeInDb(1, 2, { api_id: '123', phone: '+7900', api_hash: 'hash' });
    expect(requestBody().apiHash).toBe('hash');
  });
  it('передаёт код и признак 2FA, затем пароль без удаления пробелов', async () => {
    reply({ ok: true, needs_2fa: true });
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ ok: true, needs_2fa: true });
    expect(fetchMock.mock.calls[0][0]).toContain('/userbot/sign-in');
    expect(requestBody()).toEqual({ phone: '+7900', code: '12345' });
    reply({ ok: true, session_string: 'session' });
    expect(await signInUserbot2faInDb(1, 2, ' pass ')).toMatchObject({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toContain('/userbot/sign-in-2fa');
    expect(requestBody()).toEqual({ password: ' pass ' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('не возвращает секреты даже из неожиданных полей и сообщений', async () => {
    const secret = 'НЕ_РАСКРЫВАТЬ_СЕКРЕТ';
    reply({ ok: true, session_string: secret, phone_code_hash: secret, apiHash: secret, password: secret, code: secret, message: secret, nested: { secret } });
    const result = await signInUserbotInDb(1, 2, '+7900', '12345');
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toContain(secret);
    reply({ ok: false, error: secret, message: secret });
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ error: 'auth_error' });
    reply({ success: true, userbotEnabled: 1, apiHash: secret, session_string: secret });
    expect(JSON.stringify(await setUserbotSettingsInDb(1, 2, { enabled: 1 }))).not.toContain(secret);
  });
  it.each(['invalid_code', 'code_expired', 'invalid_password', 'flood_wait', 'timeout', 'process_exit'])('сохраняет код ошибки %s', async (error) => {
    reply({ ok: false, error, message: 'secret' });
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ ok: false, error });
  });
  it.each([400, 401, 403, 404, 500])('возвращает безопасную ошибку HTTP %i', async (status) => {
    reply({ message: 'secret' }, status);
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toEqual({ ok: false, error: `http_${status}`, message: `Ошибка API: HTTP ${status}` });
  });
  it.each([null, [], {}, { ok: 'true' }, { ok: true, needs_2fa: 'true' }])('отклоняет некорректный ответ %j', async (data) => {
    reply(data);
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ ok: false, error: 'invalid_response' });
  });
  it('обрабатывает сетевую ошибку и некорректный JSON без сырого текста', async () => {
    fetchMock.mockRejectedValueOnce(new Error('secret'));
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ error: 'request_failed' });
    fetchMock.mockResolvedValueOnce(new Response('not json: secret'));
    expect(await signInUserbotInDb(1, 2, '+7900', '12345')).toMatchObject({ error: 'request_failed' });
    reply({ success: true, userbotEnabled: 2 });
    expect(await setUserbotSettingsInDb(1, 2, { enabled: 1 })).toMatchObject({ error: 'invalid_response' });
  });
});
