/** @fileoverview Проверки DNS и перенаправлений защищённого HTTP-клиента. */
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: mocks.lookup }));
vi.mock('node:http', () => ({ default: { request: mocks.request } }));
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
  beforeEach(() => { mocks.lookup.mockReset(); mocks.request.mockReset(); });
  it('отклоняет DNS с внутренним адресом до открытия соединения', async () => {
    mocks.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]);
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('закрепляет разрешённый адрес и отклоняет перенаправление во внутреннюю сеть', async () => {
    mocks.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    mocks.request.mockImplementation((_url, options, done) => {
      const req = Object.assign(new EventEmitter(), { end: () => done(response(302, 'http://127.0.0.1/secret')), destroy: vi.fn() });
      options.lookup('example.com', {}, (err: unknown, ip: string) => { expect(err).toBeNull(); expect(ip).toBe('8.8.8.8'); });
      return req;
    });
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
});
