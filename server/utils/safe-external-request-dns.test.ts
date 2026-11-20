/** @fileoverview Проверки DNS и перенаправлений защищённого HTTP-клиента. */
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn(), httpsRequest: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: mocks.lookup }));
vi.mock('node:http', () => ({ default: { request: mocks.request } }));
vi.mock('node:https', () => ({ default: { request: mocks.httpsRequest } }));
import { safeExternalRequest } from './safe-external-request';

/** Создаёт подставной HTTP-ответ.
 * @param status - Код ответа
 * @param location - Адрес перенаправления
 * @returns Поток ответа
 */
function response(status: number, location?: string) {
  return Object.assign(new EventEmitter(), { statusCode: status, headers: location ? { location } : {}, resume: vi.fn() });
}

describe('DNS и перенаправления', () => {
  beforeEach(() => { mocks.lookup.mockReset(); mocks.request.mockReset(); mocks.httpsRequest.mockReset(); });
  it('отклоняет DNS с внутренним адресом до открытия соединения', async () => {
    mocks.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]);
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('закрепляет разрешённый адрес и отклоняет перенаправление во внутреннюю сеть', async () => {
    mocks.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    mocks.request.mockImplementation((options, done) => {
      const req = Object.assign(new EventEmitter(), { end: () => done(response(302, 'http://127.0.0.1/secret')), destroy: vi.fn() });
      expect(options).toMatchObject({ hostname: '8.8.8.8', path: '/file', headers: { Host: 'example.com' }, agent: false });
      return req;
    });
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it('проверяет каждый новый DNS и использует имя исходного сервера только для HTTP и TLS', async () => {
    mocks.lookup.mockResolvedValueOnce([{ address: '8.8.8.8', family: 4 }])
      .mockResolvedValueOnce([{ address: '1.1.1.1', family: 4 }]);
    const redirect = response(302, 'https://example.org:8443/report?format=txt');
    mocks.request.mockImplementation((_options, done) => Object.assign(new EventEmitter(), { end: () => done(redirect) }));
    mocks.httpsRequest.mockImplementation((_options, done) => Object.assign(new EventEmitter(), { end: () => done(response(200)) }));

    const result = await safeExternalRequest('http://example.com/file', 'HEAD');
    expect(result.url.href).toBe('https://example.org:8443/report?format=txt');
    expect(redirect.resume).toHaveBeenCalledOnce();
    expect(mocks.lookup).toHaveBeenNthCalledWith(2, 'example.org', { all: true, verbatim: true });
    expect(mocks.httpsRequest).toHaveBeenCalledWith(expect.objectContaining({
      hostname: '1.1.1.1', family: 4, servername: 'example.org', port: '8443',
      path: '/report?format=txt', headers: { Host: 'example.org:8443' }, method: 'HEAD', agent: false,
    }), expect.any(Function));
  });
});
